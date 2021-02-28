const express = require('express');
const router = express.Router();
const axios = require('axios');
const md5 = require('md5');
const BASE_URL = "https://api.timetap.com/test";
const log = console.log;

let sessionToken = null;

async function generate() {
  try {
    const apiKey = process.env.APIKEY;
    const private_key = process.env.PRIVATE_KEY;
    const signature = md5("" + apiKey + private_key);
    const timestamp = Math.round(Date.now() / 1000);
    const tokenURL = `${BASE_URL}/sessionToken?apiKey=${apiKey}` +
      `&timestamp=${timestamp}&signature=${signature}`;

    const res = await axios.get(tokenURL);
    sessionToken = res.data.sessionToken; // CRITICAL sessionToken must be set here!
  } catch (err) {
    log(err.data)
    return err;
  }
}
/* GET home page. */
router.get('/', function (req, res, next) {
  try {
    if (sessionToken === null) {
      generate()
        .then(
          () => {
            // sessionToken = value;
            res.render('index');
          }
        );
    } else {
      res.render('index');
    }

  } catch (err) {
    log(err.data)
    return err;
  }
});

/* OLD METHOD OF GETTING VALUES, one by one
async function get_appts(status, startDate, locationId) {
  if (sessionToken === null) {
    sessionToken = await generate();
  }
  startDate = startDate.trim();
  locationId = locationId.trim();
  const APPT_COUNT =
    `${BASE_URL}/appointmentList/reportCount?statusList=${status}`
    + `&startDate=${startDate}&endDate=${startDate}&locationIdList=${locationId}`;

  const url = APPT_COUNT + "&sessionToken=" + sessionToken;

  try {
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    if (err.response.status === 401) {

      // sessionToken = 
      await generate(); // get new value for sessionToken

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
*/

async function count_appts(startDate, locationId) {
  if (sessionToken === null) {
    await generate();
  }
  startDate = startDate.trim();
  locationId = locationId.trim();

  const APPT_COUNT = BASE_URL +
    `/appointments/countByStatus/location/${locationId}?startDate=${startDate}&endDate=${startDate}`;

  const url = APPT_COUNT + "&sessionToken=" + sessionToken;

  try {
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    if (err.response.status === 401) {

      // sessionToken = 
      await generate(); // get new value for sessionToken

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
  count_appts(startDate, locationId).then(
    (data) => {
      let results = prep_results(data);
      results.TITLE = "Appts: " + location;
      results.LOCATION = location;
      results.startDate = startDate;
      results.locationId = locationId;
      res.render('results', results)
    }
  );
  
});

function prep_results(data) {

  const results = {};

  const tags = ["OPEN", "CANCELLED", "COMPLETED", "PENDING"];
  for (let tag of tags) {
    results[tag] = data[tag] || 0; // default value is zero
  }

  results.TOTAL = results.OPEN + results.COMPLETED;
  return results;
}

router.get('/refresh/:startDate/:locationId', function (req, res, next) {
  const { startDate, locationId } = req.params;
  if (startDate == undefined) return;
  count_appts(startDate, locationId).then(
    (data) => res.send(prep_results(data))
  );
});

module.exports = router;
