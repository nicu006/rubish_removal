(function () {
    function initCoverageMap() {
        var mapEl = document.getElementById('coverageMap');
        var grid = document.querySelector('.coverage-county-grid');
        if (!mapEl || !grid) return;

        if (typeof L === 'undefined') {
            mapEl.innerHTML =
                '<p class="coverage-map-fallback">Map could not start (Leaflet missing). Ensure <code>vendor/leaflet/leaflet.js</code> loads and open this page via your web server (not as a file).</p>';
            return;
        }

        /** Fill colours aligned with the standard east-Ireland county map (Louth / Meath / Dublin / Kildare / Wicklow). */
        var COUNTY_COLORS = {
            Louth: '#85c1e9',
            Meath: '#eb984e',
            Dublin: '#f7dc6f',
            Kildare: '#3498db',
            Wicklow: '#ec7063'
        };

        var countyLayers = {};
        var map;

        function styleForCounty(name, isSelected) {
            var fill = COUNTY_COLORS[name] || '#95a5a6';
            return {
                color: isSelected ? '#0d3d5c' : '#2c3e50',
                weight: isSelected ? 2.25 : 1.35,
                fillColor: fill,
                fillOpacity: isSelected ? 0.72 : 0.4,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round'
            };
        }

        /** Centroid of the polygon — better than bounds center for coastal counties (e.g. Dublin bay). */
        function labelLatLngForLayer(layer) {
            if (typeof layer.getCenter === 'function') {
                try {
                    return layer.getCenter();
                } catch (ignore) {}
            }
            return layer.getBounds().getCenter();
        }

        function applyStyles(selectedName) {
            Object.keys(countyLayers).forEach(function (n) {
                countyLayers[n].setStyle(styleForCounty(n, n === selectedName));
            });
        }

        function selectButton(activeBtn) {
            var cards = grid.querySelectorAll('.coverage-county-card');
            for (var i = 0; i < cards.length; i++) {
                var btn = cards[i];
                var on = btn === activeBtn;
                btn.classList.toggle('is-selected', on);
                btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            }
        }

        function showCounty(countyName, buttonEl) {
            if (!countyLayers[countyName]) return;
            applyStyles(countyName);
            if (buttonEl) selectButton(buttonEl);
            map.fitBounds(countyLayers[countyName].getBounds(), {
                padding: [36, 36],
                maxZoom: 11,
                animate: true
            });
        }

        map = L.map(mapEl, { scrollWheelZoom: false, attributionControl: false });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: ''
        }).addTo(map);

        var geoUrl = new URL('geo/coverage-counties.json', window.location.href).toString();

        fetch(geoUrl)
            .then(function (r) {
                if (!r.ok) throw new Error('geojson');
                return r.json();
            })
            .then(function (data) {
                L.geoJSON(data, {
                    smoothFactor: 1.35,
                    style: function (feature) {
                        var n = feature.properties && feature.properties.name;
                        return styleForCounty(n, false);
                    },
                    onEachFeature: function (feature, layer) {
                        var n = feature.properties && feature.properties.name;
                        if (n) {
                            countyLayers[n] = layer;
                            var center = labelLatLngForLayer(layer);
                            layer.bindTooltip(n, {
                                permanent: true,
                                direction: 'center',
                                className: 'coverage-county-label',
                                interactive: false
                            });
                            layer.openTooltip(center);
                        }
                    }
                }).addTo(map);

                applyStyles('Dublin');

                var dBtn = grid.querySelector('.coverage-county-card[data-county="Dublin"]');
                if (dBtn) selectButton(dBtn);
                if (countyLayers.Dublin) {
                    map.fitBounds(countyLayers.Dublin.getBounds(), { padding: [40, 40], maxZoom: 11 });
                }

                grid.addEventListener('click', function (e) {
                    var btn = e.target.closest('.coverage-county-card');
                    if (!btn || !grid.contains(btn)) return;
                    var county = btn.getAttribute('data-county');
                    if (county && countyLayers[county]) showCounty(county, btn);
                });

                grid.addEventListener('keydown', function (e) {
                    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                    var buttons = Array.prototype.slice.call(grid.querySelectorAll('.coverage-county-card'));
                    var i = buttons.indexOf(document.activeElement);
                    if (i < 0) return;
                    e.preventDefault();
                    var next = e.key === 'ArrowRight' ? i + 1 : i - 1;
                    if (next < 0) next = buttons.length - 1;
                    if (next >= buttons.length) next = 0;
                    buttons[next].focus();
                });
            })
            .catch(function () {
                try {
                    map.remove();
                } catch (err) {}
                mapEl.innerHTML =
                    '<p class="coverage-map-fallback">Could not load county data. Open this page via the site URL (e.g. <code>http://localhost/...</code>) so <code>geo/coverage-counties.json</code> can load.</p>';
            });

        function invalidate() {
            try {
                if (map) map.invalidateSize();
            } catch (err) {}
        }

        window.addEventListener('load', invalidate);
        setTimeout(invalidate, 400);
        setTimeout(invalidate, 900);

        if (window.ResizeObserver) {
            var ro = new ResizeObserver(invalidate);
            ro.observe(mapEl);
        }
    }

    if (document.readyState === 'complete') {
        initCoverageMap();
    } else {
        window.addEventListener('load', initCoverageMap);
    }
})();
