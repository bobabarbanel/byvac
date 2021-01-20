$(function () {
    const interval = setInterval(function () {
        refreshValues();
    }, 1000);
    
    async function  refreshValues() {
        const value = await axios.get('/refresh');
        const {COMPLETED, PENDING} = value.data;
        
        if(PENDING == 0) { // no more pending vaccines
            clearInterval(interval);
            $('body').css("background", "orange");
            return;
        }
        $("#completed").text(COMPLETED);
        $("#pending").text(PENDING);
        $("#total").text(PENDING + COMPLETED);
    }
});