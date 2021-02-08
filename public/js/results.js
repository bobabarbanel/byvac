$(function () {
    const locationId = $('locationId').text();
    const startDate = $('startDate').text();
    $("#time").text("As of " + new Date())
    const refreshTime =  3 * 60 * 1000; // 3 minutes

    const TRANSITION_COLOR = '#AED6F1';
    const afterTransitionColors = {
        "PENDING": "wheat",
        "CANCELLED": "wheat",
        "COMPLETED": "white",
        "TOTAL": "white",
        "OPEN": "pink",
    };

    $("#bar").css("width", 0.1 + "%")
    draw(Date.now(), refreshTime)
    // const tableWidth = parseInt($('table').css('width'));
    const interval = setInterval(function () {
        refreshValues();
        draw(Date.now(), refreshTime * .95)
        $("#time").css('background', TRANSITION_COLOR).text("As of " + new Date());
        setTimeout(() => {
            $("#time").css('background', "white");
        }, 500)
    }, refreshTime);

    async function draw(start, end) {
        const indicator = setInterval(() => {
            const now = Date.now() - start;

            $("#bar").css("width", 610 * now / end + "px")
            // console.log(610 * now / end)
            if (now >= (.98) * end) {
                clearInterval(indicator);
                $("#bar").css("width", 0.1 + "%"); // reset
            }
        }, 5000)
    }

    async function refreshValues() {

        let total = 0;

        for (let status of ["PENDING", "CANCELLED", "COMPLETED", "OPEN", "TOTAL"]) {
            const target = $("#" + status);
            if (status === "TOTAL") {
                $("#TOTAL").css('background', TRANSITION_COLOR).text(total);
            } else {
                let url = `/refresh/${status}/${startDate}/${locationId}`;
                const value = await axios.get(url);
                const count = value?.data?.count;
                if (count !== undefined) {



                    if (status === "OPEN" || status === "COMPLETED") {
                        total += +count;
                    }
                    target.css("background", TRANSITION_COLOR).text(value.data.count);
                    if (status === "OPEN" && count === 0) { // no more OPEN vaccines
                        clearInterval(interval);
                        $('body').css("background", "orange");
                    }
                } else {
                    console.warn(status, "value.data.count undefined")
                }
            }
            setTimeout(() => {
                target.css('background', afterTransitionColors[status]);
            }, 500)
        }
    }
});
