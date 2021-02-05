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
async function generate() {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const tokenURL = `${BASE_URL}/sessionToken?apiKey=${apiKey}` +
      `&timestamp=${timestamp}&signature=${signature}`;

    const res = await axios.get(tokenURL);
    return res.data.sessionToken;
  } catch (err) {
    console.log(err.data)
    return err;
  }
}
/* GET home page. */
router.get('/', function (req, res, next) {
  try {
    generate()
      .then(
        sessionToken => {
          res.render('index', { sessionToken });
        }
      );
  } catch (err) {
    console.log(err.data)
    return err;
  }
});

async function get_appts(status, startDate, locationId, sessionToken) {
  if (sessionToken === undefined) {
    throw new Error("No sessionToken");
  }
  const APPT_COUNT = BASE_URL +
    `/appointmentList/reportCount?statusList=${status}` +
    `&startDate=${startDate}&endDate=${startDate}&locationIdList=${locationId}&`;

  const url = APPT_COUNT + "sessionToken=" + sessionToken;

  // console.log({ url, save })

  try {
    const res = await axios.get(url);
    // console.log("get appts", res.data)
    return res.data;
  } catch (err) {
    if (err.response.status === 401) {

      sessionToken = await generate(); // get new value for sessionToken
      save.sessionToken = sessionToken;
      let url = APPT_COUNT + "sessionToken=" + sessionToken;
      try {
        const res = await axios.get(url); // try again
        return res.data;
      } catch (err) {
        throw new Error(err); // second try failed
      }
    }
  }

}
let save = {};
router.get('/appts/:date/:location/:locationId/:sessionToken', function (req, res, next) {
  const startDate = req.params.date;
  const location = req.params.location;
  const locationId = req.params.locationId;
  const sessionToken = req.params.sessionToken;
  save = { startDate, location, locationId, sessionToken };
  // console.log(save);

  const promises = [
    get_appts('COMPLETED', startDate, locationId, sessionToken),
    get_appts('OPEN', startDate, locationId, sessionToken)
  ]
  Promise.all(promises).then(

    (values) => {
      // console.log({ values })
      res.render('results', {
        'LOCATION': location,
        'DATE': startDate,
        'COMPLETED': values[0].count,
        'OPEN': values[1].count,
        'TITLE': "Appts: " + location
      })
    }
  );
});


router.get('/refreshOPEN', function (req, res, next) {

  const { startDate, locationId, sessionToken } = save;
  if (startDate == undefined) return;
  // console.log('/refreshOPEN');

  get_appts('OPEN', startDate, locationId, sessionToken).then(
    (v) => {
      res.send({
        'OPEN': v.count
      })
    }
  );
});

router.get('/refreshCOMPLETED', function (req, res, next) {

  const { startDate, locationId, sessionToken } = save;
  if (startDate == undefined) return;
  // console.log('/refreshCOMPLETED');

  get_appts('COMPLETED', startDate, locationId, sessionToken).then(
    (v) => {
      res.send({
        'COMPLETED': v.count
      })
    }
  );
});

module.exports = router;
