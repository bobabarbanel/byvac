$(function () {
    const locationId = $('locationId').text().trim();
    const startDate = $('startDate').text().trim();
    const location = $('location').text().trim();
    const timeLeft = $('.countdown_timer');
    const bar = $('bar');

    const REFRESH_TIME = .5 * 60 * 1000; // 3 minutes

    const TRANSITION_COLOR = '#AED6F1';
    const AFTER_TRANSITION_COLORS = {
        "PENDING": "wheat",
        "CANCELLED": "wheat",
        "COMPLETED": "white",
        "TOTAL": "white",
        "OPEN": "pink",
        "time": "white"
    };
    let indicator;
    bar.css("width", 0.1 + "%");
    init_timer();
    draw(Date.now(), REFRESH_TIME)
    const interval = setInterval(function () {
        refreshValues();
    }, REFRESH_TIME);

    async function draw(start, end) {
        indicator = setInterval(() => {
            const nowMS = Date.now() - start;
            const now = nowMS / 1000 / 60;
            let min = Math.floor(3 - now);
            let sec = Math.floor(((3 - now) - min) * 60);
            sec = Math.round(sec / 5) * 5;
            if (sec < 10) sec = '0' + sec;
            if (min < 0) {
                min = 3;
                sec = '00';
            }
            timeLeft.html(`<i class="fas fa-history"></i>&nbsp;${min}:${sec}&nbsp;`);

            bar.css("width", (80 - ((3 - now) * 80 / 3)) + "%")

            if (nowMS >= (.995) * end) {
                clearInterval(indicator);
                bar.css("width", 0.1 + "%"); // reset
            }
        }, 5000)
    }
    // function rand() { return  Math.floor(Math.random()*20); }
    async function refreshValues() {
        console.log('refreshValues')
        let url = `/refresh/${startDate}/${encodeURI(location)}/${locationId}`;
        await axios.get(url);

        if ($('#OPEN').text() !== '0') {
            init_timer();
            draw(Date.now(), REFRESH_TIME * .95).then(() => init_timer());
        }
        else {
            clearInterval(interval);
            if (indicator) clearInterval(indicator);
            bar.css("width", "80%").css('background-color', 'green');
            $("body").css('background-color', 'lightgrey');
        }
    }

    function init_timer() {
        timeLeft.html('<i class="fas fa-history"></i>&nbsp;3:00');
    }
});
