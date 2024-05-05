var deviceIsOpen = false;
var video_id = null;

function go_get() {
    openPedals("RPF");
    var search_field = document.getElementById('yourtextfield').value;
    if (search_field.startsWith("https://youtu.be/")) {
        video_id = search_field.substring("https://youtu.be/".length);
        video_id = video_id.substring(0, video_id.indexOf("?"))
        console.log("Found video id " + video_id)
    } else if (search_field.startsWith("https://www.youtube.com/watch?v=")) {
        video_id = search_field.substring("https://www.youtube.com/watch?v=".length);
        if (video_id.includes("&")) {
            video_id = video_id.substring(0, video_id.indexOf("&"))
        }
        console.log("Found video id " + video_id)
    } else {
        alert("Can't find video id from " + search_field);
    }
    // 2. This code loads the IFrame Player API code asynchronously.
    var tag = document.createElement('script');

    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player = null;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '390',
        width: '640',
        videoId: video_id,
        playerVars: {
            'playsinline': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        setTimeout(stopVideo, 6000);
        done = true;
    }
}

function stopVideo() {
    player.stopVideo();
}

async function openPedals(pedal_order) {
    console.log("Opening pedals with order " + pedal_order);
    let device;
    try {
        const devices = await navigator.hid.requestDevice({
            filters: [
                // Old VEC
                {
                    vendorId: 0x05f3,
                    productId: 0x00ff,
                },
                // Philips old version
                {
                    vendorId: 0x0911,
                    productId: 0x184c,
                },
                // Philips
                {
                    vendorId: 0x0911,
                    productId: 0x1844,
                },
                // Philips Foot Control LFH 2330/00
                {
                    vendorId: 0x0911,
                    productId: 0x091a,
                },
                // Infinity
                {
                    vendorId: 0x0e0f,
                    productId: 0x0003,
                },
                // Grundig pedals
                {
                    vendorId: 0x15d8,
                    productId: 0x0024,
                },
                // Olympus
                {
                    vendorId: 0x07b4,
                    productId: 0x0218,
                },
                // Olympus RS31H in Olympus mode
                {
                    vendorId: 0x07b4,
                    productId: 0x025f,
                },
                // Olympus hand controller
                {
                    vendorId: 0x07b4,
                    productId: 0x26E,
                },
                // DictaPhone pedal
                {
                    vendorId: 0x04b4,
                    productId: 0x0100,
                },
                {
                    vendorId: 0x04b4,
                    productId: 0x0100,
                },
            ],
        });
        device = devices[0];
    } catch (error) {
        console.log("An error occurred.");
    }

    if (!device) {
        console.log("No device was selected.");
    } else {
        console.log(`HID: ${device.productName}`);
        console.log("Opener found the device requested by main")
        if (!deviceIsOpen) {
            await device.open();
            deviceIsOpen = true;
        }
        device.addEventListener("inputreport", event => {
            const {data, hid_device_handle, reportId} = event;
            console.log("Read from device " + device.productName + " result " + JSON.stringify(data))
            let bytes = convertBytes(data, device.vendorId, device.productId)
            let command = "S";
            if (bytes == 0) {
                // Command defaults to stop already
            }
            if (bytes == PEDAL_MIDDLE) {
                command = pedal_order.charAt(1);
            }
            if (bytes == PEDAL_LEFT) {
                command = pedal_order.charAt(0);
            }
            if (bytes == PEDAL_RIGHT) {
                command = pedal_order.charAt(2);
            }

            if (player != null) {
                if (command == "P") {
                    player.playVideo();
                }
                if (command == "R") {

                }
                if (command == "F") {

                }
                if (command == "S") {
                    player.pauseVideo();
                }
            }
        });
    }
}

var PEDAL_LEFT = 1;
var PEDAL_MIDDLE = 4;
var PEDAL_RIGHT = 2;

function convertBytes(buffer, vid, pid) {
    // VEC
    let button = 0;
    let left = 0;
    let right = 0;
    let middle = 0;
    // Old vec
    if (vid == 0x05f3 && pid == 0x00ff) {
        button = buffer.getUint8(0);
        left = 1;
        right = 4;
        middle = 2;
    }
    // Philips old version
    if (vid == 0x0911 && pid == 0x184c) {
        button = buffer.getUint8(0);
        left = 1;
        right = 2;
        middle = 4;
    }
    // Philips
    if (vid == 0x0911 && pid == 0x1844) {
        button = buffer.getUint8(0);
        left = 1;
        right = 2;
        middle = 4;
    }

    // Philips Foot Control LFH 2330/00
    if (vid == 0x0911 && pid == 0x091a) {
        button = buffer.getUint8(0);
        left = 4;
        right = 1;
        middle = 2;
    }
    // Infinity
    if (vid == 0x0e0f && pid == 0x0003) {
        button = buffer.getUint8(0);
        left = 4;
        right = 2;
        middle = 1;
    }
    // Grundig pedals
    if (vid == 0x15d8 && pid == 0x0024) {
        button = buffer.getUint8(0);
        left = 4;
        right = 2;
        middle = 1;
    }
    // Olympus
    if (vid == 0x07b4 && pid == 0x0218) {
        button = buffer.getUint8(2);
        left = 1;
        right = 2;
        middle = 4;
    }
    // Olympus RS31H in Olympus mode
    if (vid == 0x07b4 && pid == 0x025f) {
        button = buffer.getUint8(2);
        left = 4;
        right = 1;
        middle = 2;
    }
    // Olympus hand controller
    if (vid == 0x07b4 && pid == 0x26E) {
        button = buffer.getUint8(2);
        left = 4;
        right = 1;
        middle = 2;
    }
    // Grundig sonicmic
    if (vid == 0x15d8 && pid == 0x025) {
        if (buffer.getUint8(1) == 1) {
            button = buffer.getUint8(6);
            left = 4;
            right = 16;
            middle = 8;
        }
    }
    // DictaPhone pedal
    if (vid == 0x04b4 && pid == 0x0100) {
        button = buffer.getUint8(0);
        left = 1;
        right = 2;
        middle = 4;
    }

    // Use F1, F2, F3 on Speechmike to simulate
    if (vid == 0x911 && pid == 0xC1C) {
        button = buffer.getUint8(7);
        left = 2;
        right = 8;
        middle = 4;
    }


    let toSet = 0;
    if (0 != (button & left)) {
        toSet += PEDAL_LEFT;
    }
    if (0 != (button & right)) {
        toSet += PEDAL_RIGHT;
    }
    if (0 != (button & middle)) {
        toSet += PEDAL_MIDDLE;
    }
    return toSet;
}

