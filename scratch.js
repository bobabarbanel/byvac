
const axios = require('axios');
const BASE_URL = "https://api.timetap.com/test";
const md5 = require('md5');

const apiKey = "340692";
const private_key = "25179069129544f4a568ac34bde87ff5";
const signature = md5(apiKey + private_key);

const timestamp = Math.round(Date.now() / 1000);
const tokenURL = `${BASE_URL}/sessionToken?apiKey=${apiKey}` +
    `&timestamp=${timestamp}&signature=${signature}`;
let theDate = process.argv[2]
if (theDate === undefined) {
    var dateFormat = require('dateformat');
    let today = new Date();
    theDate = dateFormat(today, "yyyy-mm-dd");
}
console.log("Date: ", theDate)
axios.get(tokenURL).then(
    (r) => {
        const sessionToken = r.data.sessionToken;
        console.log({ sessionToken });
        // getCount('COMPLETED', sessionToken);
        // getCount('OPEN', sessionToken);
        // getCount('CANCELLED', sessionToken);
        // getTest(sessionToken)
        getLocations(sessionToken);
        // get_all("2021-02-26", sessionToken);
    }
);

function getLocations(token) {
    const theURL =
        `${BASE_URL}/locations?sessionToken=${token}`;

    axios.get(theURL).then(
        (v) => {
            console.log(theURL);
            console.log(v.data);
            console.log('--------------');
        }
    ).catch(e => console.log(e))
}

function getCount(status, token) {
    const theURL =
        `${BASE_URL}/appointmentList/reportCount?statusList=${status}`
        + `&startDate=${theDate}&endDate=
        
        ${theDate}&locationIdList=466979&sessionToken=${token}`;

    axios.get(theURL).then(
        (v) => {
            console.log(theURL);
            console.log(status, v.data);
            console.log('--------------');
        }
    ).catch(e => console.log(e))
}

function getTest(token) {
    // /appointments/countByStatus/location/{locationId}
    let theDate = "2021-02-26";
    const theURL = `${BASE_URL}/appointments/countByStatus/location/466979?startDate=${theDate}&endDate=${theDate}&sessionToken=${token}`;
    // const url = APPT_COUNT + "&sessionToken=" + sessionToken;

    axios.get(theURL).then(
        (v) => {
            console.log(theURL);
            console.log('countByStatus', v.data);
            console.log('--------------');
        }
    ).catch(e => console.log("error", e))
}

function getCounts(token) {
    // /appointments/countByStatus/location/{locationId}
    const theURL = `${BASE_URL}/locations?sessionToken=${token}`;

    // const theURL = `${BASE_URL}/locations?sessionToken=${token}`;

    axios.get(theURL).then(
        (v) => {
            console.log(theURL);
            // v.data.forEach(d => { 
            //     console.log( {locationId: d.locationId, name: d.locationName})
            // });
            console.log('--------------');
        }
    ).catch(e => console.log("error", e))
}
const allLocationIds = [471236, 466979, 469984, 466980];
function get_all(startDate, sessionToken) {
    let urls = allLocationIds.map((locationId) => {
        let aURL = BASE_URL +
            `/appointments/countByStatus/location/${locationId}?startDate=${startDate}&endDate=${startDate}`;

        return aURL + "&sessionToken=" + sessionToken;

    });
    console.log(urls);
    const promises = urls.map(url => axios.get(url));
    const result = { COMPLETED: 0, PENDING: 0, CANCELLED: 0, OPEN: 0 };
    Promise.all(promises).then(
        values => {

            values.forEach(({ data }) => {
                console.log(data);
                for (let key in data) {
                    result[key] += data[key];
                }
            })
            console.log(JSON.stringify(result, null, 4));
        })
}
