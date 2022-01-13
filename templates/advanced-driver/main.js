var driver=function(e){var r={};function n(t){if(r[t])return r[t].exports;var o=r[t]={i:t,l:!1,exports:{}};return e[t].call(o.exports,o,o.exports,n),o.l=!0,o.exports}return n.m=e,n.c=r,n.d=function(e,r,t){n.o(e,r)||Object.defineProperty(e,r,{enumerable:!0,get:t})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,r){if(1&r&&(e=n(e)),8&r)return e;if(4&r&&"object"==typeof e&&e&&e.__esModule)return e;var t=Object.create(null);if(n.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:e}),2&r&&"string"!=typeof e)for(var o in e)n.d(t,o,function(r){return e[r]}.bind(null,o));return t},n.n=function(e){var r=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(r,"a",r),r},n.o=function(e,r){return Object.prototype.hasOwnProperty.call(e,r)},n.p="",n(n.s=0)}([function(e,r){function n(e){var r=65535&e;return 32768&r&&(r=-(65536-r)),r}r.decodeUplink=function(e){var r={},t=e.bytes;if(t.length>8)throw new Error("Invalid uplink payload: length exceeds 8 bytes");for(i=0;i<t.length;i++)switch(t[i]){case 0:if(t.length<i+3)throw new Error("Invalid uplink payload: index out of bounds when reading temperature");var o=t[i+1]<<8|t[i+2];o=util.readShort(o),r.temp=o/100,i+=2;break;case 1:if(t.length<i+3)throw new Error("Invalid uplink payload: index out of bounds when reading humidity");o=t[i+1]<<8|t[i+2],o=util.readShort(o),r.humidity=o/100,i+=2;break;case 2:r.pulseCounter=t[i+1],i+=1;break;case 3:r.volumes=[];var u=n(t[i+1]);r.volumes.push({time:new Date("2020-08-02T20:00:00.000+05:00").toISOString(),volume:u});var a=n(t[i+2]);r.volumes.push({time:new Date("2020-08-02T21:00:00.000+05:00").toISOString(),volume:a}),i+=2;break;default:throw new Error("Invalid uplink payload: unknown id '"+t[i]+"'")}return r},r.decodeDownlink=function(e){var r={},n=e.bytes;for(i=0;i<n.length;i+=2)switch(n[i]){case 0:if(n.length<i+2)throw new Error("Invalid downlink payload: index out of bounds when reading pulseCounterThreshold");r.pulseCounterThreshold=n[i+1];break;case 1:if(n.length<i+2)throw new Error("Invalid downlink payload: index out of bounds when reading alarm");r.alarm=1===n[i+1];break;default:throw new Error("Invalid downlink payload: unknown id '"+n[i]+"'")}return r},r.encodeDownlink=function(e){var r={},n=[];if(void 0!==e.pulseCounterThreshold){if(e.pulseCounterThreshold>255)throw new Error("Invalid downlink: pulseCounterThreshold cannot exceed 255");n.push(0),n.push(e.pulseCounterThreshold)}return void 0!==e.alarm&&(n.push(1),e.alarm?n.push(1):n.push(0)),r.bytes=n,r.fPort=16,r},r.extractPoints=function(e){var r={};void 0!==e.message.temp&&(r.temperature=e.message.temp),void 0!==e.message.humidity&&(r.humidity=e.message.humidity),void 0!==e.message.pulseCounter&&(r.pulseCounter=e.message.pulseCounter),void 0!==e.message.humidity&&(r.airHumidity=e.message.humidity);let n=e.message.volumes;return void 0!==n&&(r.volume=[],n.forEach(e=>{r.volume.push({eventTime:e.time,value:e.volume})})),r}}]);