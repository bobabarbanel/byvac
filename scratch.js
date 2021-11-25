
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
console.log(theDate);
// console.log("Date: ", theDate)
axios.get(tokenURL).then(
    (r) => {
        const sessionToken = r.data.sessionToken;
        // console.log({ sessionToken });
        // getTest(sessionToken, theDate);
        // getAppts(sessionToken);
        // getCount('COMPLETED', sessionToken);
        // getCount('OPEN', sessionToken);
        // getCount('CANCELLED', sessionToken);
        // getAppts(sessionToken,'2021-08-28')
        // getLocations(sessionToken);
        // get_all("2021-02-26", sessionToken);
        getReasonIds('2021-09-25', sessionToken);
    }
);
async function getReasonIds(startDate, sessionToken) {
    let theURL = BASE_URL +
        `/reasonIdList?startDate=${startDate}endDate=${startDate}`;
    theURL += "&sessionToken=" + sessionToken;
    console.log(theURL);
    await axios.get(theURL).then(
        (result) => {
            console.log(result);
        }
    )
}

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
    let theURL =
        `${BASE_URL}/appointments/report/?locationIdList=471236&startDate=${theDate}` +
        `&endDate=${theDate}&sessionToken=${token}` +
        `&pageSize=2&pageNum=1`;
    theURL = "https://api.timetap.com/test/appointments/report/?locationIdList=471236&startDate=2021-09-25&endDate=2021-09-25&sessionToken=st.api.api.6052015f7ff24984a7db7a89f9bf1a27&pageSize=6&pageNumber=1"

    console.log({ theURL })
    initializeVS();
    console.log("start get");
    axios.get(theURL).then(
        (v) => {
            console.log(Object.keys(v));
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
            },
            OTHER: {
            }
        }
        for (let key in vacStatus) {
            for (let c of ['M', 'P', 'J'])  // vaccine types
                vacStatus[key][c] = 0;
        }
    }
    function pivot({ status, fields, reason }) {
        // const vaccine = reason.reasonDesc.split(/\s/)[0];
        // console.log({ status, vaccine });
        // if ()
        //     const vac = vacStatus[status];
        // if (vac[vaccine]) {
        //     vac[vaccine]++;
        // }
        // else {
        //     vac[vaccine] = 1;
        // }

        const vaccineChar = reason.reasonDesc
            .split(/\s/)[0]
            .charAt(0); // 1st char of 1st string
        if (status === 'NO_SHOW') { status = 'CANCELLED'; } // treat no-shows as cancelled
        if (vacStatus[status][vaccineChar] === undefined) {
            console.log('*** pivot', status, vaccineChar, 'ignored')
        } else {
            console.log('pivot', status, vaccineChar)
            vacStatus[status][vaccineChar]++;
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
const reasonIdList = '';

const reasons = {
    603786:
        'J',
    602378:
        'P',
    602666:
        'P',
    633414:
        'P',
    632795:
        'P',
    625379:
        'P',
    608303:
        'J',
    596286:
        'M',
    596326:
        'M',
    631581:
        'M',
    625390:
        'M',
    609790:
        'P',
    593237:
        'M',
    600099:
        'M',
    594738:
        'M',
    600103:
        'M',
    593248:
        'M',
    595870:
        'M',
    595873:
        'M',
    603714:
        'P',
    602389:
        'P',
    603717:
        'P',
    602645:
        'P',
}
function get_reasonIds(startDate, sessionToken) {
    let reasonIdList = Object.keys(reasons).join(',');

    let statusList = 'PENDING,OPEN,COMPLETED,CANCELLED,NO_SHOW'
    let theURL = BASE_URL +
        // `/services?startDate=2021-02-21@endDate=2021-11-21`;
        // `/reasonIdList?startDate=${startDate}endDate=${startDate}`;
        `/appointmentList/reportCountsByStatus?reasonIdList=${reasonIdList}&startDate=${startDate}&endDate=${startDate}&statusList=${statusList}`

    theURL += "&sessionToken=" + sessionToken;
    console.log(theURL);
    axios.get(theURL).then(
        (result) => {

            console.log(result.data);
            console.log('--------------');
        }
    ).catch(e => console.log("error", e));
}
