const axios = require('axios');
const BASE_URL = "https://api.timetap.com/test";
const md5 = require('md5');

const apiKey = "340692";
const private_key = "25179069129544f4a568ac34bde87ff5";
const signature = md5(apiKey + private_key);

const timestamp = Math.round(Date.now() / 1000);
const tokenURL = `${BASE_URL}/sessionToken?apiKey=${apiKey}` +
    `&timestamp=${timestamp}&signature=${signature}`;

axios.get(tokenURL).then(
    (r) => {
        const sessionToken = r.data.sessionToken;
        console.log({ sessionToken });
        getCount('COMPLETED', sessionToken);
        getCount('OPEN', sessionToken);
        // getCount('PENDING', sessionToken);
        // getTest(sessionToken)
    }
);

function getCount(status, token) {
    const theURL =
        `${BASE_URL}/appointmentList/reportCount?statusList=${status}`
        + `&startDate=2021-02-18&endDate=2021-02-18&locationIdList=466979&sessionToken=${token}`;
    console.log(theURL);
    axios.get(theURL).then(
        (v) => {
            console.log(status, v.data);
        }
    ).catch(e => console.log(e))
}

function getTest(token) {
    // /appointments/countByStatus/location/{locationId}
    // const theURL = `${BASE_URL}/appointments/countByStatus/location/466979?startDate=2021-02-19&endDate=2021-02-19&sessionToken=${token}`;
    
        const theURL = `${BASE_URL}/locations?sessionToken=${token}`;
    console.log(theURL);
    axios.get(theURL).then(
        (v) => {
            console.log(v.data);
        }
    ).catch(e => console.log("error", e))
}

// {
//     headers: {
//       'Test-Header': 'test-value'
//     }
