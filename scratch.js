const axios = require('axios');
const BASE_URL = "https://api.timetap.com/test";
const md5 = require('md5');

const apiKey = "340692";
const private_key = "25179069129544f4a568ac34bde87ff5";
const signature = md5("" + apiKey + private_key);

const timestamp = Math.round(Date.now() / 1000);
const tokenURL = `${BASE_URL}/sessionToken?apiKey=${apiKey}` +
    `&timestamp=${timestamp}&signature=${signature}`;

axios.get(tokenURL).then(
    (r) => {
        let token = r.data.sessionToken;
        console.log({ token });
        // getCount('COMPLETED', token);
        // getCount('PENDING', token);
        getLocations(token)
    }
);

async function getCount(status, token) {
    const theURL =
        `https://api.timetap.com/test/appointmentList/reportCount?statusList=${status}`
        + `&startDate=2021-02-11&endDate=2021-02-11&locationIdList=466979&sessionToken=${token}`;
    console.log(theURL);
    axios.get(theURL).then(
        (v) => {
            console.log(status, v.data);
        }
    )
}

async function getLocations(token) {
    const theURL = `https://api.timetap.com/appointmentList/reportCount`;
    const options = {
        sessionToken: `${token}`,
        method: 'get',
        url: theURL,
    };
    console.log({ theURL })
    try {
        let r = await axios(options);
        console.log(r);
    } catch (e) {
        console.log("error", e);
    }


}
