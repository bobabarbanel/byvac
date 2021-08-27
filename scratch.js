
const axios = require('axios');
const BASE_URL = "https://api.timetap.com/test";
const md5 = require('md5');

let vacStatus;

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
// console.log("Date: ", theDate)
axios.get(tokenURL).then(
    (r) => {
        const sessionToken = r.data.sessionToken;
        // console.log({ sessionToken });
        getTest(sessionToken, '2021-08-28');
        // getAppts(sessionToken);
        // getCount('COMPLETED', sessionToken);
        // getCount('OPEN', sessionToken);
        // getCount('CANCELLED', sessionToken);
        // getAppts(sessionToken,'2021-08-28')
        // getLocations(sessionToken);
        // get_all("2021-02-26", sessionToken);
    }
);

function getLocations(token) {
    const theURL =
        `${BASE_URL}/locations?sessionToken=${token}`;

    axios.get(theURL).then(
        (v) => {
            console.log(theURL);
            v.data.forEach(
                loc => console.log(loc.locationId, loc.locationName)
            )
            console.log('--------------');
        }
    ).catch(e => console.log(e))
}

function getAppts(token, clinicDate) {
    const theURL =
        // `${BASE_URL}/reports/category&sessionToken=${token}`;
        `${BASE_URL}/appointments/report?startDate=${clinicDate}endDate=${clinicDate}&sessionToken=${token}`;
    console.log(theURL)
    axios.get(theURL).then(
        (v) => {
            console.log(theURL);
            console.log(status, JSON.parse(v));
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

function getTest(token, theDate) {
    // /appointments/countByStatus/location/{locationId}
    // let theDate = "2021-08-28";
    const theURL =
        `${BASE_URL}/appointments/report/?locationIdList=466979&startDate=${theDate}&endDate=${theDate}&sessionToken=${token}`;
    // const url = APPT_COUNT + "&sessionToken=" + sessionToken;
    initializeVS();
    console.log("start get");
    axios.get(theURL).then(
        (v) => {
            console.log(theURL);
            v.data.forEach(
                patient => pivot(patient)
            );
            console.log(JSON.stringify(vacStatus, null, 4));
            console.log('--------------');
        }
    ).catch(e => console.log("error", e));

    
    function initializeVS() {
        vacStatus =
        {
            CANCELLED: {
            },
            OPEN: {
            },
            COMPLETED: {
            }
        }
    }
    function pivot({ status, reason }) {
        const vaccine = reason.reasonDesc.split(/\s/)[0]
        // console.log(status, vaccine)
        const vac = vacStatus[status];
        if (vac[vaccine]) {
            vac[vaccine]++;
        }
        else {
            vac[vaccine] = 1;
        }
    }
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
