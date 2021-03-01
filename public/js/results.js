$(function () {
    const locationId = $('locationId').text();
    const startDate = $('startDate').text();
    const timeLeft  = $('.results_title > span');
    const timeStamp = $("#time");

    timeStamp.text("As of " + new Date())
    const REFRESH_TIME = 3 * 60 * 1000; // 3 minutes

    const TRANSITION_COLOR = '#AED6F1';
    const AFTER_TRANSITION_COLORS = {
        "PENDING": "wheat",
        "CANCELLED": "wheat",
        "COMPLETED": "white",
        "TOTAL": "white",
        "OPEN": "pink",
        "time": "white"
    };

    $("#bar").css("width", 0.1 + "%");
    timeLeft.text('3:00');
    draw(Date.now(), REFRESH_TIME)
    // const tableWidth = parseInt($('table').css('width'));
    const interval = setInterval(function () {
        refreshValues();
    }, REFRESH_TIME);

    async function draw(start, end) {
        const indicator = setInterval(() => {
            const nowMS = Date.now() - start;
            const now = nowMS/1000/60;
            const min = Math.floor(3 - now );
            let sec = Math.floor(((3 - now ) - min) * 60);
            sec = Math.round(sec / 5) * 5;
            if (sec < 10) sec = '0' + sec;
            if (min < 0) {
                timeLeft.text('3:00');
            } else {
                timeLeft.text(`${min}:${sec}`)
            }
            $("#bar").css("width", 615 * nowMS / end + "px")

            if (nowMS >= (.995) * end) {
                clearInterval(indicator);
                $("#bar").css("width", 0.1 + "%"); // reset
            }
        }, 5000)
    }
    // function rand() { return  Math.floor(Math.random()*20); }
    async function refreshValues() {
        let url = `/refresh/${startDate}/${locationId}`;
        const data = (await axios.get(url)).data;
        for (let tag in data) {
            const target = $('#' + tag);
            
            target.css("background", TRANSITION_COLOR).text(data[tag]);

            setTimeout(() => {
                target.css('background', AFTER_TRANSITION_COLORS[tag]);
            }, 500);
            if (data[OPEN] == 0) {
                clearInterval(interval);
            }
        }
        timeLeft.text('3:00');
        draw(Date.now(), REFRESH_TIME * .95).then(() => timeLeft.text('3:00'));
        
        timeStamp.css('background', TRANSITION_COLOR).text("As of " + new Date());
        setTimeout(() => {
            timeStamp.css('background', AFTER_TRANSITION_COLORS["time"]);
        }, 500)
    }
});
