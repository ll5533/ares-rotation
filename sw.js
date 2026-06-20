// ARES 농구 로테이션 - 오프라인 캐싱 서비스워커
// network-first + HTML은 HTTP 캐시 우회(항상 최신). 오프라인이면 마지막 캐시 사용.
const CACHE = "ares-cache-v2";
const ASSETS = ["./", "./index.html"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var accept = req.headers.get("accept") || "";
  var isDoc = req.mode === "navigate" || accept.indexOf("text/html") !== -1;
  // HTML/내비게이션 요청은 HTTP 캐시를 우회해 항상 최신을 받음
  var fetchReq = isDoc ? new Request(req.url, { cache: "reload" }) : req;
  e.respondWith(
    fetch(fetchReq).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || caches.match("./index.html"); });
    })
  );
});
