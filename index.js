var gmap, cs=[], _, markers=[], cm, mapLabel;

function initMap(){
  gmap = new google.maps.Map(document.getElementById("map"), {center: {lat: 0, lng: 0}, zoom: 1});
  google.maps.event.addListener(gmap, "click",function(e){
    if(window.event.ctrlKey){
      markers.push(new google.maps.Marker({
	position: e.latLng,
	draggable: true,
 	map: gmap,
      }));
      addMarker(markers[markers.length-1]);
      cs = pSort(Array.prototype.map.call(markers,function(_m,i){
	_m.setLabel({text: (++i).toString(), fontWeight: 'bold', color: 'white'});
	return [_m.position.lat(),_m.position.lng()];
      }));
      cs.push(cs[0]);
    }
    else mapLabel.set('text','');
  });
  var s = document.createElement('script');

  // Another library from the Google archive (It was introduced in such a way, because this code executed before the Google API could load async)
  // Note: `async defer` was added for a reason.

  s.src="js-map-label/src/maplabel.js";

  document.body.appendChild(s);
}

const MARKERS  = null;
const LINES   = false;
const POLYGON = true;

function switchState(ns){
  if(_==ns) return; // Same state (MARKERS)
  _==null?showMarkers(null):_.setMap(null);
  if(ns==MARKERS) showMarkers(gmap);
  else if(ns) _ = new google.maps.Polygon({paths: cs, strokeColor: "#FF0000", strokeOpacity: 0.8, strokeWeight: 2, fillColor: "#FF0000", fillOpacity: 0.35, map: gmap});
  else _ = new google.maps.Polygon({paths: cs, strokeColor: "#FF0000", strokeOpacity: 0.8, strokeWeight: 2, fillColor: "#FF0000", fillOpacity: 0, map: gmap});
}

function importCSV(e){
  var input = event.target;
  var reader = new FileReader();
  reader.onload = function(){implementCSV(reader.result);};
  reader.readAsText(input.files[0]);
}

function onLoad(){
  Array.prototype.forEach.call(document.getElementsByClassName("button"), child => {
    child.addEventListener("click", function(evt){headerClicked(evt,child);});
  });

  document.getElementById('csvInput').onchange = importCSV;
  document.getElementById('fA').click();
}

/*
function pSort(points){
  const c = points.reduce((pp,np)=>{pp[0] += np[0]/points.length; pp[1] += np[1]/points.length; return pp;},[0,0]);
  const angles = points.map((p)=> {return {lat: p[0], lng: p[1], angle: Math.atan2(p[1] - c[1], p[0] - c[0]) * 180 / Math.PI };});
  return angles.sort((a, b) => a.angle - b.angle);
}
*/

function pSort(points){
  const c = points.reduce((pp,np)=>{pp.lat += np.lng/points.length; pp.lng += np.lng/points.length; return pp;},{lat: 0, lng: 0});
  console.log(c);
  const angles = points.map((p)=> ({lat: p.lat, lng: p.lng, angle: Math.atan2(p.lng - c.lng, p.lat - c.lat) * 180 / Math.PI }));
  return angles.sort((a, b) => a.angle - b.angle);
}

function showMarkers(map){
  markers.forEach(marker=>marker.setMap(map));
  if(map!=null) _ = null;
}

function implementCSV(csvStr) {
  if(markers!=null) _==null ? showMarkers(null) : _.setMap(null);
  var i = 0, n;
  var head = Array.prototype.map.call(csvStr.substr(0, csvStr.indexOf('\r\n')).split(','),s=>s.trim());
  for(var n=0; n<head.length; ++n) if(head[n]=="lat"||head[n]=="latitude"){ i=n; break;}
  n = cs.length==0;
  cs = markers.map(m=>({lat: m.position.lat(), lng: m.position.lng()}));
  const o = csvStr.split('\r\n').map(l=>l.split(',').filter(e=>!(e==null||e==""))).filter(l=>l.length).map(l=>({lat: parseFloat(l[i]), lng: parseFloat(l[i+1])}));
  o.shift();
  Array.prototype.push.apply(cs, o);
  markers.forEach((m)=>m.setMap(null));
  markers = Array.prototype.map.call(cs,(c,i)=>new google.maps.Marker({
    position: c,
    draggable: true, map: gmap,
    label: {text: (++i).toString(), fontWeight: 'bold', color: 'white'},
  }));
  markers.forEach(addMarker);
  if(cs.length==0) return;
  console.log(cs);
  cs = pSort(cs);
  console.log(cs);
  cs.push(cs[0]);
  if(n){
   cm = markers[0];
   gmap.setZoom(16);
   gmap.panTo(cm.position);
   mapLabel = new MapLabel({strokeColor: '#000', strokeWeight: 0.5, text: "("+(cm.position.lat()).toFixed(2)+","+(cm.position.lng()).toFixed(2)+")", position: markers[0].position, map: gmap, fontSize: 16, align: 'center'});
   cm.bindTo('map', mapLabel);
   cm.bindTo('position', mapLabel);
  _ = null;
  }
}

function addMarker(m){
  m.addListener('drag',   (e) => replaceMarker(e,m));
  m.addListener('click',  (e) => replaceMarker(e,m));
  m.addListener('dragend',(e) => dragEnd(e,m));
  google.maps.event.addListener(m, 'rightclick',(e)=>removeMarker(e,m));
}

function dragEnd(e,m){
  m.position = e.latLng;
  cs = pSort(Array.prototype.map.call(markers,(_m)=>({lat: _m.position.lat(), lng: _m.position.lng()})));
  cs.push(cs[0]);
}

function removeMarker(e,m){
  if(m==cm){
    m.unbind('map', mapLabel);
    m.unbind('position', mapLabel);
    mapLabel.set('text','');
  }
  m.setMap(null);
  markers = markers.filter((_m)=>_m!=m);
  cs = pSort(Array.prototype.map.call(markers,function(_m,i){
  _m.setLabel({text: (++i).toString(), fontWeight: 'bold', color: 'white'});
    return {lat: _m.position.lat(), lng: _m.position.lng()};
  }));
  cs.push(cs[0]);
}

function replaceMarker(e,m)
{
  if(cm!=m){
    if(cm!=null){
      cm.unbind('map', mapLabel); 
      cm.unbind('position', mapLabel);
    }
    mapLabel.set('position',m.position);
    m.bindTo('map', mapLabel);
    m.bindTo('position', mapLabel);
    cm=m;
  }
  mapLabel.set('text','('+(e.latLng.lat()).toFixed(2)+','+(e.latLng.lng()).toFixed(2)+')');
}

function headerClicked(evt,e){
        var btn = e;
	var x = evt.pageX;
      	var y = evt.pageY;

        var duration = 500;
        var animationFrame, animationStart;
  
        var animationStep = function(timestamp) {
        if (!animationStart) {
          animationStart = timestamp;
        }

        var frame = timestamp - animationStart;
        if (frame < duration) {

        var easing = (frame/duration) * (2 - (frame/duration));
        var circle = "circle at " + x + "px " + y + "px";
        var color  = "rgba(0, 0, 0, " + (0.3 * (1 - easing)) + ")";
        var stop   = 90 * easing + "%";

    e.style.backgroundImage = "radial-gradient(" + circle + ", " + color + " " + stop + ", transparent " +stop+")";
        animationFrame = window.requestAnimationFrame(animationStep);
     }
     else {
       btn.style.backgroundImage = "none";
       window.cancelAnimationFrame(animationFrame);
      }    
    };
     animationFrame = window.requestAnimationFrame(animationStep);

  }

function downloadFile(){
    const data = cs.map(function(c){
      console.log(c);
      try{return '"'+c.lat()+'","'+c.lng()+'"';}catch(e){return '"'+c.lat+'","'+c.lng+'"';}
    });
    data.unshift('"lat","lng"')
    var file = new Blob([data.join('\n')], {type: ".csv, text/csv"});
    if (window.navigator.msSaveOrOpenBlob) window.navigator.msSaveOrOpenBlob(file, filename);
    else {
        var a = document.createElement("a"), url = URL.createObjectURL(file);
        a.href = url;
        a.download = "download.csv";
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {document.body.removeChild(a); window.URL.revokeObjectURL(url);}, 0); 
    }
}