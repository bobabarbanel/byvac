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
const statusList = 'PENDING,OPEN,COMPLETED,CANCELLED,NO_SHOW';
const vaccineList = 'Moderna,Pfizer,Flu'

let reasonIds = [];
class VacStore {
  constructor(date, location, locId) {
    this.vs = this.init(date, location, locId);
  }

  getVS() {
    return this.vs;
  }

  init(date, location, locId) {
    
    const vs =
    {
      status: null,
      LOCATION: location,
      startDate: date,
      locationId: locId,
      CANCELLED: {},
      OPEN: {},
      COMPLETED: {},
      PENDING: {},
      NO_SHOW: {},
      timeStamp: new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'long', timeZone: 'America/Los_Angeles' }).format(new Date())
    }
    for (let k of statusList.split(',')) {
      for (let c of ['M', 'P', 'F'])  // vaccine types // 23 Oct 2022: all ow "F" for Flu
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
    log("generate error", { tokenURL }, err.data);
    return err;
  }
}
/* GET home page. */
router.get('/', function (ignore, res) {
  // log('index page');
  res.render("index");
});


// Admin routes
// router.get('/cache',
//   function (req, res) {
//     res.json(recs);
//   });
// router.get('/clear',
//   function (ignore, res) {
//     if (Object.values(recs).find(v => v.getCache().status !== 'done')) {
//       res.json({ message: 'Active Calculations' });
//     }
//     else {

//       res.json({ message: 'Cache cleared.' });
//     }
//   });

router.get('/appts/:startDate/:location/:locationId',
  function (req, res) {
    let { startDate, location, locationId } = req.params;
    // log("/appts get", req.params);
    startDate = startDate.trim();
    location = location.trim();
    locationId = locationId.trim();
    // get initialized vs
    const vs = new VacStore(startDate, location, locationId).getVS();
    ////////////////////////////////////////
    // log('/appt calling calculate')
    ////////////////////////////////////////

    calculate(startDate, locationId, vs)
      .then(
        () => {
          log('calculate returns')
          switch (vs.status) {
            case 'done':
              res.render('results', vs); // deep copy ?
              break;

            case 'error':
              res.render('error', {
                message: '/refresh calculate error',
                vs
              })
              break;
          }
        })
      .catch(err => { })
  });

async function getReasonIds(startDate) {
  // log('getReasonIds', { getReasonIds })
  if (sessionToken === null) {
    await generate('getReasonIds');
    if (reasonIds.length === 0) {
      let theURL = BASE_URL +
        `/reasonIdList?startDate=${startDate}endDate=${startDate}`;
      theURL += "&sessionToken=" + sessionToken;
      // log('getReasonIds', theURL);
      const result = await axios.get(theURL)
      reasonIds = result.data.join(',');
      // log('getReasonIds now = ', reasonIds);
    }
    return reasonIds;
  }
  if (reasonIds.length === 0) {
    let theURL = BASE_URL +
      `/reasonIdList?startDate=${startDate}endDate=${startDate}`;
    theURL += "&sessionToken=" + sessionToken;
    // log('getReasonIds', theURL);
    const result = await axios.get(theURL)
    reasonIds = result.data.join(',');
    // log('getReasonIds now = ', reasonIds);
  }
  return reasonIds;
}

// function calculate(startDate, locationId, vs) {
//   // log('calculate 1 vs ', vs);



async function calculate(theDate, locationId, vs) {
  log('calculate');
  // log('calculate START vs1', vs, { sessionToken, reasonIds });
  reasonIds = await getReasonIds(theDate);
  // log('calculate START vs2', vs, { sessionToken, reasonIds });
  // log('calculate', { theDate, locationId, vs });

  // await queryPage(pageSize, pageNumber++, theDate, locationId, vs);
  log('queryCounts', 'before')
  return queryCounts(theDate, locationId, vs);

}



async function queryCounts(theDate, locationId, vs) {
  log('queryCounts');
  const theURL = BASE_URL + `/appointmentList/reportCountsByStatus` +
    `?reasonIdList=${reasonIds}&startDate=${theDate}` +
    `&endDate=${theDate}&statusList=${statusList}&sessionToken=${sessionToken}`;
  // log('queryCounts start', theDate, locationId, reasonIds, sessionToken, statusList);
  log(theURL)
  try {
    vs.status = 'in-progress';
    const results = await axios.get(theURL);
    pivot(vs, results.data);
    do_totals(vs, results.data);

    vs.status = 'done';
  }
  catch (err) {
    vs.status = 'error';
    vs.error = err;
  }
}



function pivot(vs, data) {
  // data is an array of objects, like this
  /*{
    status: 'OPEN',
    objectName: 'Moderna Sess  - 3rd DOSE',
    objectType: 'REASON',
    objectId: 625390,
    count: 1
  }*/
  data.forEach(
    ({ status, objectName, count }) => {
      if (count) {
        objectName = objectName.replace(/ .*/, '');
        
        if (vaccineList.includes(objectName)) {
          log(objectName);
          vs[status][objectName[0].toUpperCase()] += count;
        }
        else {
          log("Not Found", objectName);
        }

      }
    }
  )
  log('completed p', vs.COMPLETED.P);
  log('completed m', vs.COMPLETED.M);
}


function do_totals(vs) {
  /*
  for (let id of ['OPEN_TOTAL', 'COMPLETED_TOTAL',
            'TOTAL_OC_P', 'TOTAL_OC_M', 'TOTAL_OC_F',
            'TOTAL_OC',
            'PENDING_TOTAL', 'CANCELLED_TOTAL', 'NO_SHOW_TOTAL']) {
              */
  vs.OPEN_TOTAL = vs.OPEN.P + vs.OPEN.M + vs.OPEN.F;
  vs.COMPLETED_TOTAL = vs.COMPLETED.P + vs.COMPLETED.M + vs.COMPLETED.F;
  vs.TOTAL_OC_P = vs.OPEN.P + vs.COMPLETED.P;
  vs.TOTAL_OC_M = vs.OPEN.M + vs.COMPLETED.M;
  vs.TOTAL_OC_F = vs.OPEN.F + vs.COMPLETED.F;
  vs.TOTAL_OC = vs.TOTAL_OC_P + vs.TOTAL_OC_M + vs.TOTAL_OC_F;
  vs.PENDING_TOTAL = vs.PENDING.P + vs.PENDING.M + vs.PENDING.F;
  vs.NO_SHOW_TOTAL = vs.NO_SHOW.P + vs.NO_SHOW.M + vs.NO_SHOW.F;
  vs.CANCELLED_TOTAL = vs.CANCELLED.P + vs.CANCELLED.M + vs.CANCELLED.F;
  log('completed total', vs.COMPLETED_TOTAL);
}

router.get('/refresh/:startDate/:location/:locationId',
  function (req, res) { // Consider error handling here??
    const { startDate, location, locationId } = req.params;
    log('/refresh', { startDate, location, locationId });
    const vs = new VacStore(startDate, location, locationId).getVS();
    log('/refresh', vs)

    calculate(startDate, locationId, vs)
      .then(
        () => {
          switch (vs.status) {
            case 'done':
              res.json(vs); // deep copy ?
              break;

            case 'error':
              res.render('error', {
                message: '/refresh calculate error type 1',
                vs
              })
              break;
          }
        })
      .catch(err => {
        res.render('error', {
          message: '/refresh calculate error type 2',
          vs
        })
      })
  });

module.exports = router;