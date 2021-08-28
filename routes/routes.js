const express = require('express');
const router = express.Router();
const axios = require('axios');
const md5 = require('md5');
const DEBUG = true;
function log(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}
const BASE_URL = "https://api.timetap.com/test";
let sessionToken = null;

async function generate(tag) {
  log("generate(" + tag + ") called")
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
  res.render("index");
});


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

router.get('/appts/:startDate/:location/:locationId', function (req, res) { 
  let { startDate, location, locationId } = req.params;
  log("get", req.params )
  startDate = startDate.trim();
  location = location.trim();
  locationId = locationId.trim();
  calculate(startDate, location, locationId, res);
});

function calculate(startDate, location, locationId, res) {
  log('calculate', {startDate, location, locationId});
  getOCT(startDate, locationId)
    .then(
      (vs) => {
        vs.TITLE = "Appts: " + location;
        vs.LOCATION = location;
        vs.startDate = startDate;
        vs.locationId = locationId;
        // log('130', vs);
        res.render('results', vs)
      }
    )
    .catch(err => {
      console.log(err);
      console.log("/appts", "===", { startDate, location: encodeURI(location), locationId }, "===");
    })
}


async function getOCT(theDate, locationId) {
  if (sessionToken === null) {
    await generate("getOCT");
  }
  const theURL =
    `${BASE_URL}/appointments/report/?locationIdList=${locationId}&startDate=${theDate}&endDate=${theDate}&sessionToken=${sessionToken}`;
  initializeVS();
  try {
    const v = await axios.get(theURL);
    v.data.forEach(
      patient => pivot(patient)
    );
    log('vacStatus', vacStatus);
    return vacStatus;
  }
  catch(e) {
    console.log("error", e)
  }
}


function initializeVS() {
  vacStatus =
  {
    CANCELLED: {},
    OPEN: {},
    COMPLETED: {},
    PENDING: {},
    CANCELLED: {},
    NO_SHOW: {}
  }
  for (let key in vacStatus) {
    for (let c of ['M', 'P', 'J'])  // vaccine types
      vacStatus[key][c] = 0;
  }
}
function pivot({ status, reason }) {
  const vaccineChar = reason.reasonDesc
    .split(/\s/)[0]
    .charAt(0); // 1st char of 1st string
  log('pivot', status, vaccineChar)

  vacStatus[status][vaccineChar]++;
}

// async function prep_results(data, startDate, locationId) {
//   log("prep_results data", data);

//   await getOCT(startDate, locationId);

//   log("prep_results after getOCT", vacStatus);
//   return { r, vs: vacStatus };

// }

router.get('/refresh/:startDate/:location/:locationId', function (req, res) { // Consider error handling here??
  const { startDate, location, locationId } = req.params;
  // startDate = startDate.trim();
  // locationId = locationId.trim();
  calculate(startDate, location, locationId, res);// if (startDate == undefined) return;
  // count_appts(startDate, locationId).then(
  //   async (data) => {
  //     log('calling prep_results');
  //     let forDom = await prep_results(data, startDate, locationId);
  //     log('after prep', JSON.stringify(forDom, null, 4));
  //     res.send(forDom);
  //   }
  // );
});

module.exports = router;
