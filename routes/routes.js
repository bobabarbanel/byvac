const express = require('express');
const router = express.Router();
const axios = require('axios');
const md5 = require('md5');
const BASE_URL = "https://api.timetap.com/test";

async function generate() {

  const apiKey = "340692";
  const private_key = "25179069129544f4a568ac34bde87ff5";
  const signature = md5(apiKey + private_key);
  const timestamp = Math.round(Date.now() / 1000);
  try {
    const url = `${BASE_URL}/sessionToken?apiKey=${apiKey}&timestamp=${timestamp}&signature=${signature}`;
    const res = await axios.get(url);
    // console.log(res.data.sessionToken);
    return res.data.sessionToken;
  } catch (err) {
    return err;
  }
}
/* GET home page. */
let sessionToken;
router.get('/', function (req, res, next) {
  console.log("get /");
  generate()
    .then(
      value => {
        sessionToken = value;
        res.render('index', { title: value });

      }
    );

});



// const APPOINTMENTS_REPORT = BASE_URL + "/appointments/report?";



async function get_appts(status, startDate, locationId) {

  let APPT_COUNT = BASE_URL +
    `/appointments/reportCount?statusList=${status}&startDate=${startDate}&endDate=${startDate}&locationIdList=${locationId}&&`;
  let url = APPT_COUNT + "sessionToken=" + sessionToken;

  console.log(url );

  try {
    const res = await axios.get(url);
    // console.log(res.data.sessionToken);
    return res.data;
  } catch (err) {
    if(err.response.status === 401) {
      
      sessionToken = await generate(); // get new value for sessionToken
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
router.get('/appts/:date/:location/:locationId', function (req, res, next) {
  const startDate = req.params.date;
  const location = req.params.location;
  const locationId = req.params.locationId;
  save = {startDate, location, locationId };

  console.log(req.params);
  const promises = [get_appts('COMPLETED', startDate, locationId), get_appts('PENDING', startDate, locationId)]
  Promise.all(promises).then(
    (values) => {
      res.render('results', {
        'LOCATION': location,
        'DATE': startDate,
        'COMPLETED': values[0].count,
        'PENDING': values[1].count
      })
    }
  );
});
let count = 0;
router.get('/refresh', function (req, res, next) {

  const {startDate, locationId } = save;
  if(startDate == undefined) return;

  const promises = [get_appts('COMPLETED', startDate, locationId), get_appts('PENDING', startDate, locationId)]
  Promise.all(promises).then(
    ([c,p]) => {
      if(++count === 2) sessionToken += "bug"
      res.send( {
        'COMPLETED': c.count,
        'PENDING': p.count
      })
    }
  );
});

module.exports = router;
