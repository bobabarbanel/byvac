const express = require('express');
const router = express.Router();
const axios = require('axios');
const md5 = require('md5');
const BASE_URL = "https://api.timetap.com/test";
// const apiKey = process.env.APIKEY;
const apiKey = "340692";
// const private_key = process.env.PRIVATE_KEY;
const private_key = "25179069129544f4a568ac34bde87ff5";
const signature = md5("" + apiKey + private_key);
// console.log("start", {apiKey,private_key,signature})
// let save = {};
let sessionToken = null;

async function generate() {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const tokenURL = `${BASE_URL}/sessionToken?apiKey=${apiKey}` +
      `&timestamp=${timestamp}&signature=${signature}`;

    const res = await axios.get(tokenURL);
    sessionToken = res.data.sessionToken;
    return res.data.sessionToken;
  } catch (err) {
    console.log(err.data)
    return err;
  }
}
/* GET home page. */
router.get('/', function (req, res, next) {
  try {
    if (sessionToken === null) {
      generate()
        .then(
          value => {
            sessionToken = value;
            res.render('index');
          }
        );
    } else {
      res.render('index');
    }

  } catch (err) {
    console.log(err.data)
    return err;
  }
});

async function get_appts(status, startDate, locationId) {
  if (sessionToken === null) {
    throw new Error("No sessionToken");
  }
  startDate = startDate.trim();
  locationId = locationId.trim();
  const APPT_COUNT =
    `${BASE_URL}/appointmentList/reportCount?statusList=${status}`
    + `&startDate=${startDate}&endDate=${startDate}&locationIdList=${locationId}`;

  const url = APPT_COUNT + "&sessionToken=" + sessionToken;

  try {
    const res = await axios.get(url);
    // console.log("get appts", res.data)
    return res.data;
  } catch (err) {
    if (err.response.status === 401) {

      sessionToken = await generate(); // get new value for sessionToken

      let url = APPT_COUNT + "&sessionToken=" + sessionToken;
      try {
        const res = await axios.get(url); // try again
        return res.data;
      } catch (err) {
        throw new Error(err); // second try failed
      }
    }
  }
}

router.get('/appts/:startDate/:location/:locationId', function (req, res, next) {
  const { startDate, location, locationId } = req.params;
  // get_appts(startDate, locationId).then(
  //   (data) => {
  //     let results = prep_results(data);
  //     console.log(results);
  //     results.TITLE = "Appts: " + location;
  //     results.LOCATION = location;
  //     results.startDate = startDate;
  //     results.locationId = locationId;
  //     res.render('results', results)
  //   }
  // );
  const promises = [];
  results = {};
  for (status of ["OPEN", "CANCELLED", "COMPLETED"]) {
    promises.push(get_appts(status, startDate, locationId));
  }
  Promise.all(promises).then(
    (values) => {
      results.OPEN = values[0].count;
      results.CANCELLED = values[1].count;
      results.COMPLETED = values[2].count;
      results.PENDING = "???"
      results.TOTAL = results.OPEN + results.COMPLETED;
      
      results.TITLE = "Appts: " + location;
      results.LOCATION = location;
      results.startDate = startDate;
      results.locationId = locationId;
      res.render('results', results)
    }
  )
});

// function prep_results(data) {

//   const results = {};
//   // TODO: temporary PENDING = PENDING_CONFIRMATION
//   // TODO: temporary hack
//   if (data.PENDING_CONFIRMATION) {
//     data.PENDING = data.PENDING_CONFIRMATION;
//   }
//   // console.log(data);
//   const tags = ["OPEN", "CANCELLED", "COMPLETED", "PENDING"];
//   for (let tag of tags) {
//     // console.log(tag, data[tag])
//     results[tag] = data[tag] || 0;
//     // console.log(results[tag])
//   }

//   results.TOTAL = results.OPEN + results.COMPLETED;
//   return results;
// }

router.get('/refresh/:startDate/:locationId', function (req, res, next) {
  const { startDate, locationId } = req.params;
  if (startDate == undefined) return;
  // get_appts(startDate, locationId).then(
  //   (data) => res.send(prep_results(data))
  // );
  const promises = [];
  results = {};
  for (status of ["OPEN", "CANCELLED", "COMPLETED"]) {
    promises.push(get_appts(status, startDate, locationId));
  }
  Promise.all(promises).then(
    (values) => {
      results.OPEN = values[0].count;
      results.CANCELLED = values[1].count;
      results.COMPLETED = values[2].count;
      results.PENDING = "???"
      results.TOTAL = results.OPEN + results.COMPLETED;
      // results.TITLE = "Appts: " + location;
      // results.LOCATION = location;
      // results.startDate = startDate;
      // results.locationId = locationId;
      res.send(results)
    }
  )
});

module.exports = router;
