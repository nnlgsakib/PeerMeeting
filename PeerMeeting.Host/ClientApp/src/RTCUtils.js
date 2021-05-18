/* eslint-disable */
var RTCUtils = {
  ConfigureBase: function (connection, streamEndedCallback = (event) =>{}) {
    connection.codecs.video = 'VP8'
    connection.session = {
      audio: true,
      video: true
    }
    connection.sdpConstraints.mandatory = {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true
    }
    connection.onstreamended = function (event) {
      console.log('stream ended', event)
      streamEndedCallback(event)
      var mediaElement = document.getElementById(event.streamid)
      if (mediaElement) {
        mediaElement.parentNode.removeChild(mediaElement)
      }
      var participantBlock = document.getElementById(event.userid)
      if (participantBlock) {
        participantBlock.parentNode.removeChild(participantBlock)
      }
    }
    connection.onmute = function(e) {
      if (!e || !e.mediaElement) {
          return;
      }

      if (e.muteType === 'both' || e.muteType === 'video') {
          e.mediaElement.src = null;
          var paused = e.mediaElement.pause();
          if (typeof paused !== 'undefined') {
              paused.then(function() {
                  e.mediaElement.poster = e.snapshot || '/img/transparent-muted.png';
              });
          } else {
              e.mediaElement.poster = e.snapshot || '/img/transparent-muted.png';
          }
      } else if (e.muteType === 'audio') {
          e.mediaElement.muted = true;
      }
    };
  },
  // eslint-disable-next-line
  ConfigureMediaError: function (connection, DetectRTC, callback = (videoState, audioState) => { }) {
    connection.onMediaError = function (e) {
      console.error('Media Error', e)
      if (e.message === 'Concurrent mic process limit.') {
        if (DetectRTC.audioInputDevices.length <= 1) {
          alert(
            'Please select external microphone. Check github issue number 483.'
          )
          return
        }

        var secondaryMic = DetectRTC.audioInputDevices[1].deviceId
        connection.mediaConstraints.audio = {
          deviceId: secondaryMic
        }

        connection.join(connection.sessionid)
        return
      }else{
        callback(false, true)
        connection.dontCaptureUserMedia = true
        navigator.getUserMedia =
                    navigator.getUserMedia ||
                    navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia
        navigator.getUserMedia(
          { audio: true, video: false },
          function (stream) {
            connection.addStream(stream)
            console.log('STREAM', stream)
            connection.join(connection.sessionid)
          },
          function () { }
        )
      }
    }
  },
  ScreenSharing: function(connection, state){
    connection.attachStreams.forEach(s => s.stop())
    connection.removeStream({
      audio: true,
      video: true
    });
    if(state){
      connection.addStream({
        audio: true,
        video: false,
        screen: true,
        oneway: true
      })
    }else{
      setTimeout(()=>{
        connection.addStream({
          audio: true,
          video: true,
          oneway: true
        })
      }, 500);
    }
  },
  ScreenSharingManual: function(connection, state, participant){
    connection.attachStreams.forEach(s => s.stop())
    if(state){
      navigator.mediaDevices.getDisplayMedia({video: true})
      .then(function(stream){
        connection.addStream(stream);
        var video = document.createElement("video");
        video.srcObject = stream;
        video.id = stream.id;
        participant.get(connection.userid).mediaElement = video;
      }, function(e){console.error('screen sharing', e)});
    }else{
      navigator.getUserMedia(
        { audio: true, video: false },
        function (stream) {
          connection.addStream(stream)
          participant.get(connection.userid).mediaElement = document.createElement("div");
        },
        function () { }
      )
    }
  }
}

export default RTCUtils
