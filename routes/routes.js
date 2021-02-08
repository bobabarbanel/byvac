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
    generate()
      .then(
        value => {
          sessionToken = value;
          //console.log({ sessionToken });
          
          res.render('index');
        }
      );
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
  status = status.trim();
  locationId = locationId.trim();
  
  const APPT_COUNT = BASE_URL +
    `/appointmentList/reportCount?statusList=${status}` +
    `&startDate=${startDate}&endDate=${startDate}&locationIdList=${locationId}`;

  const url = APPT_COUNT + "&sessionToken=" + sessionToken;

  // console.log('get_appts',{ status, startDate, locationId, url })
  // url = url.replace(/\s/,'');
  // console.log('get_appts',{ 'newurl': url })
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
  const {startDate, location, locationId } = req.params;
  // console.log(save);
  // startDate = startDate.trim();
  // location = location.trim();
  // locationId = locationId.trim();
  const promises = [
    get_appts('OPEN', startDate, locationId),
    get_appts('COMPLETED', startDate, locationId),
    get_appts('PENDING}', startDate, locationId),
    get_appts('CANCELLED', startDate, locationId)
  ]
  Promise.all(promises).then(

    (values) => {
      //console.log('refreshValues',values[0], values[1])
      // console.log({ values })
      const data = {
        'TITLE': "Appts: " + location,
        'LOCATION': location,
        'startDate': startDate,
        'locationId': locationId,

        'OPEN': values[0].count,
        'COMPLETED': values[1].count,
        'TOTAL': values[0].count + values[1].count,
        'PENDING': values[2].count,
        'CANCELLED': values[3].count
      };
      res.render('results', data)
    }
  );
});


router.get('/refresh/:status/:startDate/:locationId', function (req, res, next) {

  const { status, startDate, locationId } = req.params;
  
  // console.log('/refreshCOMPLETED');
  perform_get(status, startDate, locationId, res);
});

// router.get('/refreshCOMPLETED/:startDate/:locationId', function (req, res, next) {

//   const { startDate, locationId } = req.params;
  
//   // console.log('/refreshCOMPLETED');
//   perform_get('COMPLETED', startDate, locationId, res);
// });

// router.get('/refreshCANCELLED/:startDate/:locationId', function (req, res, next) {

//   const { startDate, locationId } = req.params;
  
//   // console.log('/refreshCOMPLETED');
//   perform_get('CANCELLED', startDate, locationId, res);
// });

// router.get('/refreshPENDING/:startDate/:locationId', function (req, res, next) {

//   const { startDate, locationId } = req.params;
//   // console.log('/refreshCOMPLETED');
//   perform_get('PENDING', startDate, locationId, res);
// });

 function perform_get(status, startDate, locationId, res) {
  
  if (startDate == undefined) return;
  get_appts(status, startDate, locationId).then(
    (v) => {
      res.send({
        count: v.count
      })
    }
  );
 }




module.exports = router;
