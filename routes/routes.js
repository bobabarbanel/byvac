const express = require('express');
const router = express.Router();
const axios = require('axios');
const md5 = require('md5');
const BASE_URL = "https://api.timetap.com/test";
const apiKey = "340692"; // process.env.APIKEY; 
const private_key = "25179069129544f4a568ac34bde87ff5"; // process.env.PRIVATE_KEY; 
const signature = md5(apiKey + private_key);
async function generate() {

  
  
  const timestamp = Math.round(Date.now() / 1000);
  try {
    const url = `${BASE_URL}/sessionToken?apiKey=${apiKey}&timestamp=${timestamp}&signature=${signature}`;
    const res = await axios.get(url);
    return res.data.sessionToken;
  } catch (err) {
    return err;
  }
}
/* GET home page. */
let sessionToken;
router.get('/', function (req, res, next) {
  generate()
    .then(
      value => {
        sessionToken = value;
        res.render('index', { /*sessionToken, private_key, signature, apiKey*/ });
      }
    );

});

async function get_appts(status, startDate, locationId) {

  let APPT_COUNT = BASE_URL +
    `/appointments/reportCount?statusList=${status}&startDate=${startDate}&endDate=${startDate}&locationIdList=${locationId}&&`;
  let url = APPT_COUNT + "sessionToken=" + sessionToken;


  try {
    const res = await axios.get(url);
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

  const promises = [get_appts('COMPLETED', startDate, locationId), get_appts('OPEN', startDate, locationId)]
  Promise.all(promises).then(
    
    (values) => {
      
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


router.get('/refresh', function (req, res, next) {

  const {startDate, locationId } = save;
  if(startDate == undefined) return;
  console.log('/refresh');
  const promises = [
    get_appts('COMPLETED', startDate, locationId), 
    get_appts('OPEN', startDate, locationId)
  ]
  Promise.all(promises).then(
    ([c,p]) => {
      res.send( {
        'COMPLETED': c.count,
        'OPEN': p.count
      })
    }
  );
});

module.exports = router;
