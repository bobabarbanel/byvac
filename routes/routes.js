const express = require('express');
const router = express.Router();
const axios = require('axios');
const md5 = require('md5');
const DEBUG = false;
function log(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}
const BASE_URL = "https://api.timetap.com/test";
let sessionToken = null;
let recs = {}; // global single VacStore object

class VacStore {
  constructor(ip, date, location, locId) {
    this.cache = this.init(ip, date, location, locId);
    recs[ip] = this;
  }
  getCache() { // 
    return this.cache;
  }

  init(ip, date, location, locId) {
    const vs =
    {
      ip,
      status: null,
      LOCATION: location,
      startDate: date,
      locationId: locId,
      CANCELLED: {},
      OPEN: {},
      COMPLETED: {},
      PENDING: {},
      timeStamp: new Date()
    }
    for (let k of ['CANCELLED', 'OPEN', 'COMPLETED', 'PENDING']) {
      for (let c of ['M', 'P', 'J'])  // vaccine types
        vs[k][c] = 0;
    }
    return vs;
  }
}


async function generate(tag) {
  // log("generate(" + tag + ") called")
  try {
    const apiKey = process.env.APIKEY;
    const private_key = process.env.PRIVATE_KEY;
    const signature = md5("" + apiKey + private_key);
    const timestamp = Math.round(Date.now() / 1000);
    // log("generate", { apiKey, private_key, signature, timestamp });

    const tokenURL = `${BASE_URL}/sessionToken?apiKey=${apiKey}` +
      `&timestamp=${timestamp}&signature=${signature}`;
    // log("generate", { tokenURL });
    const res = await axios.get(tokenURL);
    sessionToken = res.data.sessionToken; // CRITICAL sessionToken must be set here!
  } catch (err) {
    console.log("generate error", { tokenURL }, err.data);
    return err;
  }
}
/* GET home page. */
router.get('/', function (ignore, res) {
  log('index page');
  res.render("index");
});


// Admin routes
router.get('/cache',
  function (req, res) {
    res.json(recs);
  });
router.get('/clear',
  function (ignore, res) {
    if (Object.values(recs).find(v => v.getCache().status !== 'done')) {
      res.json({ message: 'Active Calculations' });
    }
    else {
      recs = {};
      res.json({ message: 'Cache cleared.' });
    }
  });

router.get('/appts/:startDate/:location/:locationId',
  function (req, res) {
    
    let { startDate, location, locationId } = req.params;
    log("/appts get", req.params);
    startDate = startDate.trim();
    location = location.trim();
    locationId = locationId.trim();
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const vs = new VacStore(ip, startDate, location, locationId).getCache();

    ////////////////////////////////////////
    log('/appt vs initial', vs)
    ////////////////////////////////////////
    calculate(startDate, location, locationId, vs, ip, res);
  });

function calculate(startDate, location, locationId, vs, ip, res) {
  // log('calculate 1 vs ', vs);
  getOCT(startDate, locationId, vs)
    .then(
      () => {
        log('calculate AFTER getOCT vs', vs)

        if (vs.status === 'done') {
          log('calculate done', vs)
          res.render('results', vs);

        }
        else {
          res.render('error', {
            message: 'getOCT calculation error',
            vs: JSON.stringify(vs, null, 4)
          });
        }
        delete recs[ip];
      }
    )
    .catch(err => {
      console.log(err);
      console.log("with error /appts", "===", { startDate, location: encodeURI(location), locationId }, "===");
    })
}


async function getOCT(theDate, locationId, vs) {
  log('getOCT START vs', vs, vs.status);
  if (sessionToken === null) {
    await generate("getOCT");
  }
  const pageSize = 100;
  let pageNumber = 1;
  // initializeVS(theDate, location, locationId);
  // const vs = recs.getStore(theDate, locationId);
  log('getOCT AFTER generate vs', vs.status);
  vs.status = 'in progress';
  while (vs.status === 'in progress') {
    await queryPage(pageSize, pageNumber++, theDate, locationId, vs);
    vs.timeStamp = new Date();
    log('getOCT loop vs', vs.status);
  }
  vs.timeStamp = new Date();
  // vs.status should now be 'done'
  log('getOCT complete', vs);
}

async function queryPage(pageSize, pageNumber, theDate, locationId, vs) {
  log('queryPage page=', pageNumber)
  let theURL =
    `${BASE_URL}/appointments/report/?locationIdList=${locationId}` +
    `&startDate=${theDate}&endDate=${theDate}&sessionToken=${sessionToken}` +
    `&pageSize=${pageSize}&pageNumber=${pageNumber}`;
  log('queryPage vs', vs);
  try {

    const v = await axios.get(theURL);
    if (v.data.length === 0) {  // TODO: can we use v.data.length < pageSize
      vs.status = 'done';
    }
    else {
      v.data.forEach(
        patient => pivot(patient, vs)
      );
      log({
        pageNumber: pageNumber,
        vacStatus: vs
      });

      vs.status = 'in progress';
    }
  }
  catch (err) {
    if (err.response.status === 401) {

      log('401 recall generate')
      await generate("401"); // get new value for sessionToken
      theURL =
        `${BASE_URL}/appointments/report/?locationIdList=${locationId}` +
        `&startDate=${theDate}&endDate=${theDate}&sessionToken=${sessionToken}` +
        `&pageSize=${pageSize}&pageNumber=${pageNumber}`;
      //   // `&pageSize=${pageSize}&pageNumber=${pageNumber}`;
      try {
        const v = await axios.get(theURL);
        if (v.data.length === 0) { // TODO: can we use v.data.length < pageSize
          vs.status = 'done';
        }
        else {
          v.data.forEach(
            patient => pivot(patient, vs)
          );
          log({
            pageNumber: pageNumber,
            vacStatus: vs
          });

          vs.status = 'in progress';
        }
      }
      catch (err) {
        vs.status = 'error';
        vs.error = err;
      }


    } else {
      vs.status = 'error';
      vs.error = err;
    }
  }
}


function pivot({ status, reason }, vs) {

  const vaccineChar = reason.reasonDesc
    .split(/\s/)[0]
    .charAt(0); // 1st char of 1st string

  if (status === 'NO_SHOW') { status = 'CANCELLED'; } // treat no-shows as cancelled
  if (vaccineChar in vs[status]) { // ignore Flu, for example
    // log('pivot', vaccineChar, reason.reasonDesc, status);
    vs[status][vaccineChar]++;
  }
}

router.get('/refresh/:startDate/:location/:locationId',
  function (req, res) { // Consider error handling here??
    const { startDate, location, locationId } = req.params;
    // console.log('/refresh', { startDate, location, locationId });
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (recs?.[ip] && recs[ip].getCache()) {
      delete recs[ip];
    }
    const vs = new VacStore(ip, startDate, location, locationId).getCache();
    log('/refresh vs initial', vs)


    calculate(startDate, location, locationId, vs, ip, res);
    // console.log('/refresh vs', vs);


    if (vs.status === 'error') {
      vs.error = err;
      res.render('vserror', {
        message: '/refresh calculation error',
        vs: JSON.stringify(vs, null, 4)
      });
      
    }
    delete recs[ip];

  });

module.exports = router;

// const allLocationIds = [471236, 466979, 469984, 466980];

// async function count_appts(startDate, locationId) {
//   log("/appts", "===", { startDate, sessionToken, locationId }, "===")
//   if (sessionToken === null) {
//     await generate("count_appts");
//   }
//   startDate = startDate.trim();
//   locationId = locationId.trim();
//   if (locationId === 'all') {
//     return count_all(startDate);
//   }
//   else {

//     const APPT_COUNT = BASE_URL +
//       `/appointments/countByStatus/location/${locationId}?startDate=${startDate}&endDate=${startDate}`;

//     const url = APPT_COUNT + "&sessionToken=" + sessionToken;
//     log("count_appts", { url })
//     try {
//       const res = await axios.get(url);

//       log("count_appts after", res.data)

//       return res.data;
//     } catch (err) {
//       if (err.response.status === 401) {
//         log("count_appts", "401");
//         // sessionToken = 
//         await generate("401"); // get new value for sessionToken
//         log("count_appts after generate 401", { sessionToken });
//         let url = APPT_COUNT + "&sessionToken=" + sessionToken;
//         try {
//           const res = await axios.get(url); // try again
//           return res.data;
//         } catch (err) {
//           console.log("generate error", { url }, err.response.status)
//           //throw new Error(err); // second try failed
//           return {};
//         }
//       }
//     }
//   }
// }

// async function count_all(startDate) {
//   let urls = allLocationIds.map((locationId) => {
//     let aURL = BASE_URL +
//       `/appointments/countByStatus/location/${locationId}?startDate=${startDate}&endDate=${startDate}`;

//     return aURL + "&sessionToken=" + sessionToken;
//   });
//   try {
//     const promises = urls.map(url => axios.get(url));
//     const values = await Promise.all(promises);
//     const result = { COMPLETED: 0, PENDING: 0, CANCELLED: 0, OPEN: 0 }
//     values.forEach(({ data }) => {
//       for (let key in data) {
//         result[key] += data[key];
//       }
//     })
//     return result;
//   } catch (err) {
//     if (err.response.status === 401) {

//       // sessionToken = 
//       await generate("401"); // get new value for sessionToken

//       let url = APPT_COUNT + "&sessionToken=" + sessionToken;
//       try {
//         const res = await axios.get(url); // try again
//         return res.data;
//       } catch (err) {
//         throw new Error(err); // second try failed
//       }
//     }
//   }
// }