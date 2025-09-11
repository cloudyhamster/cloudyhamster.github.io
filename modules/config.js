export const layerconfigs = [
    {
        name: "Sunrise Times (Local)",
        colors: ['#2c003e', '#7a004b', '#d83c3e', '#ff962d', '#fffa73', '#87ceeb'],
        domain: [4, 5, 6, 7, 8, 10],
        legendlabels: { start: '4:00 AM', end: '10:00 AM' },
        getvalue: (lat, lng, date) => {
            const times = SunCalc.getTimes(date, lat, lng);
            if (isNaN(times.sunrise.getTime())) return NaN;
            const timezone = tzlookup(lat, lng);
            const dateobj = new Date(times.sunrise);
            const hour = parseInt(dateobj.toLocaleTimeString('en-GB', { timeZone: timezone, hour: 'numeric' }));
            const minute = parseInt(dateobj.toLocaleTimeString('en-GB', { timeZone: timezone, minute: 'numeric' }));
            return hour + (minute / 60);
        }
    },
    {
        name: "Sunset Times (Local)",
        colors: ['#fde725', '#f89540', '#e56b5d', '#cb4778', '#a32f8d', '#7e03a8', '#4b0055'],
        domain: [15, 16, 17, 18, 19, 21, 23],
        legendlabels: { start: '3:00 PM', end: '11:00 PM' },
        getvalue: (lat, lng, date) => {
            const times = SunCalc.getTimes(date, lat, lng);
            if (isNaN(times.sunset.getTime())) return NaN;
            const timezone = tzlookup(lat, lng);
            const dateobj = new Date(times.sunset);
            const hour = parseInt(dateobj.toLocaleTimeString('en-GB', { timeZone: timezone, hour: 'numeric' }));
            const minute = parseInt(dateobj.toLocaleTimeString('en-GB', { timeZone: timezone, minute: 'numeric' }));
            return hour + (minute / 60);
        }
    },
    {
        name: "Daylight Hours",
        colors: ['#0d0887', '#7e03a8', '#cb4778', '#f89540', '#f0f921'],
        domain: [0, 6, 12, 18, 24],
        legendlabels: { start: '0 Hours', end: '24 Hours' },
        getvalue: (lat, lng, date) => {
            let durationhours = 0;
            const times = SunCalc.getTimes(date, lat, lng);
            if (!isNaN(times.sunrise) && !isNaN(times.sunset)) {
                durationhours = (times.sunset - times.sunrise) / (1000 * 60 * 60);
            } else if (SunCalc.getPosition(date, lat, lng).altitude > 0) {
                durationhours = 24;
            }
            return durationhours;
        }
    }
];