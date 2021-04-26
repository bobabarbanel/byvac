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

async function generate(tag) {
log("generate(" + tag + ") called")
  try {
    const apiKey = process.env.APIKEY;
    const private_key = process.env.PRIVATE_KEY;
    const signature = md5("" + apiKey + private_key);
    const timestamp = Math.round(Date.now() / 1000);
log("generate", { apiKey, private_key, signature, timestamp });

    const tokenURL = `${BASE_URL}/sessionToken?apiKey=${apiKey}` +
      `&timestamp=${timestamp}&signature=${signature}`;
log("generate", { tokenURL });
    const res = await axios.get(tokenURL);
    sessionToken = res.data.sessionToken; // CRITICAL sessionToken must be set here!
  } catch (err) {
console.log("generate error", {tokenURL}, err.data);
    return err;
  }
}
/* GET home page. */
router.get('/', function (ignore, res) {
  res.render("index");
});


const allLocationIds = [471236, 466979, 469984, 466980];

async function count_appts(startDate, locationId) {
log("/appts", "===", { startDate, sessionToken, locationId }, "===")
  if (sessionToken === null) {
    await generate("count_appts");
  }
  startDate = startDate.trim();
  locationId = locationId.trim();
  if (locationId === 'all') {
    return count_all(startDate);
  }
  else {

    const APPT_COUNT = BASE_URL +
      `/appointments/countByStatus/location/${locationId}?startDate=${startDate}&endDate=${startDate}`;

    const url = APPT_COUNT + "&sessionToken=" + sessionToken;
log("count_appts", { url })
    try {
      const res = await axios.get(url);
      return res.data;
    } catch (err) {
      if (err.response.status === 401) {
log("count_appts", "401");
        // sessionToken = 
        await generate("401"); // get new value for sessionToken
log("count_appts after generate 401", { sessionToken });
        let url = APPT_COUNT + "&sessionToken=" + sessionToken;
        try {
          const res = await axios.get(url); // try again
          return res.data;
        } catch (err) {
          console.log("generate error", {url}, err.response.status)
          throw new Error(err); // second try failed
        }
      }
    }
  }
}

async function count_all(startDate) {
  let urls = allLocationIds.map((locationId) => {
    let aURL = BASE_URL +
      `/appointments/countByStatus/location/${locationId}?startDate=${startDate}&endDate=${startDate}`;

    return aURL + "&sessionToken=" + sessionToken;

  });
  try {
    const promises = urls.map(url => axios.get(url));
    const values = await Promise.all(promises);
    const result = { COMPLETED: 0, PENDING: 0, CANCELLED: 0, OPEN: 0 }
    values.forEach(({ data }) => {
      for (let key in data) {
        result[key] += data[key];
      }
    })
    return result;
  } catch (err) {
    if (err.response.status === 401) {

      // sessionToken = 
      await generate("401"); // get new value for sessionToken

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

router.get('/appts/:startDate/:location/:locationId', function (req, res) {
  const { startDate, location, locationId } = req.params;

  count_appts(startDate.trim(), locationId.trim())
    .then(
      (data) => {
        let results = prep_results(data);
        results.TITLE = "Appts: " + location;
        results.LOCATION = location.trim();
        results.startDate = startDate.trim();
        results.locationId = locationId.trim();
        res.render('results', results)
      }
    )
    .catch(err => {
      console.log(err);
      console.log("/appts", "===", { startDate, location, locationId }, "===");
    })

});

function prep_results(data) {
log("prep_results", data);
  const results = {};

  const tags = ["OPEN", "CANCELLED", "COMPLETED", "PENDING"];
  for (let tag of tags) {
    results[tag] = data[tag] || 0; // default value is zero
  }

  results.TOTAL = results.OPEN + results.COMPLETED;
  return results;
}

router.get('/refresh/:startDate/:locationId', function (req, res) {
  const { startDate, locationId } = req.params;
  if (startDate == undefined) return;
  count_appts(startDate, locationId).then(
    (data) => res.send(prep_results(data))
  );
});

module.exports = router;
