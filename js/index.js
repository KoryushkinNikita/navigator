ymaps.ready(
    
    function init(){

        const suggestView3 = new ymaps.SuggestView('referencePoint'),

        placesList = document.getElementById('placesList');

        let checkPlaces = [], multiRoute, check = false, coords = [];



        var map = new ymaps.Map('map', {

            center: [57.62058774829468,39.847378437825974],  // Это Криста

            zoom: 13,

        },{});



        function createElements(value){
        
            if (value){

                const newLi = document.createElement('li');

                newLi.draggable = true;

                newLi.id = value;

                newLi.classList.add('listItem', 'suggest');

                const span = document.createElement('span');

                span.innerText = value;

                span.classList.add('spanText');

                newLi.appendChild(span);

                const cross = document.createElement('img');

                cross.className = 'cross';

                cross.draggable = false;

                cross.src = 'img/delet.svg';

                newLi.appendChild(cross);

                placesList.appendChild(newLi);

            }
            
        };


        const getNextElement = (cursorPosition, currentElement) => {

            const currentElementCoord = currentElement.getBoundingClientRect(),
            
            currentElementCenter = currentElementCoord.y + currentElementCoord.height / 2,
            
            nextElement = (cursorPosition < currentElementCenter) ?

            currentElement :

            currentElement.nextElementSibling;
            
            return nextElement;
        };

        
        
        function checkClick(clickCoord, referencePoints){

            let coordinates = [], content = '';

            for (let i = 0; i < referencePoints.length; i++){

                try {

                    coordinates = referencePoints[i].geometry._coordinates;

                    content = referencePoints[i].properties._data.balloonContentBody;

                } catch (e) {

                    coordinates = content = referencePoints[i];

                }

                if (Math.abs(clickCoord[0] - coordinates[0]) < 0.0005 && Math.abs(clickCoord[1] - coordinates[1]) < 0.0005) 

                    return [content , coordinates]

            }
            return false
        };

        



        document.getElementById('referencePoint').addEventListener('keydown', function(e){

            if (e.keyCode === 13){
                
                geocodeCheck(this.value);

                if (!multiRoute){

                    multiRoute = new ymaps.multiRouter.MultiRoute({

                        referencePoints: [],

                        params: {

                            results: 3

                        }, 

                    }, {

                        boundsAutoApply: true

                    });

                    map.geoObjects.add(multiRoute);

                    multiRoute.events.add('click', function(e){

                        const clickCoords = e.get('coords');

                        const checkOnClick = checkClick(clickCoords, multiRoute.model.getReferencePoints());

                        if (checkOnClick) {

                            map.balloon.open(checkOnClick[1], {

                                contentHeader: checkOnClick[0],

                                contentBody: "Здесь могла быть ваша реклама",
                                
                            });
                        };
                        
                       
                    })

                    multiRoute.editor.start({

                        addMidPoints:false,

                    })

                }

                setTimeout(() => {

                    if (check){

                        const referencePoints = multiRoute.model.getReferencePoints();

                        if (checkPlaces.indexOf(this.value.replace(/\s/g, '')) == '-1'){

                            let newGeoObject = new ymaps.GeoObject({

                                geometry:{

                                    type: "Point", 

                                    coordinates: coords,

                                },

                                properties: {
                                    
                                    balloonContentBody: this.value,

                                }
                            } , {

                                    openEmptyBalloon: true,

                                    openEmptyHint: true,
                                }
                            );

                            createElements(this.value);

                            referencePoints.push(newGeoObject);

                            checkPlaces.push(this.value.replace(/\s/g, ''));

                            try{

                                map.setCenter(coords);

                                multiRoute.model.setReferencePoints(referencePoints);

                                console.log("Точка добавлена");

                            } catch (error){console.log(error)}

                            

                        }
                    }

                    this.value = '';

                }, 400);

            }

        });




        placesList.addEventListener('click', function(e) {

            if (e.target.className == 'cross'){

                let referencePoints = multiRoute.model.getReferencePoints();

                const index = checkPlaces.indexOf(e.target.parentNode.innerText.replace(/\s/g, ''));

                referencePoints.splice(index, 1);

                checkPlaces.splice(index, 1);

                multiRoute.model.setReferencePoints(referencePoints);

                this.removeChild(e.target.parentNode);
                
                console.log('Точка удалена');

            }
        });



        placesList.addEventListener('dragstart', (e) => {

            e.target.classList.add('selected');

        });




        placesList.addEventListener('dragend', function (e) {

            checkPlaces = [];

            let newPoints = [], needDelete = false;

            e.target.classList.remove('selected');

            const Points = this.childNodes,
            
            referencePoints = multiRoute.model.getReferencePoints(),

            length = referencePoints.length;

            for (let j = 0; j < Points.length; j++){

                for (let i = 0; i < length; i++){

                    try{

                        placeName = referencePoints[i].properties._data.balloonContentBody;
            
                    } catch (err){
                    
            
                        placeName = '';
            
                    }
            
                    needDelete = true;
            
                    if (placeName.includes(Points[j].innerText)) {

                        newPoints.push(referencePoints[i]); 

                        checkPlaces.push(Points[j].innerText.replace(/\s/g, '')); 

                        needDelete = false; break;}
                }

            if (needDelete) {

                Points[j].parentNode.removeChild(Points[j]);

                j--;
                
            }
        }
        
        multiRoute.model.setReferencePoints(newPoints);

        });





        placesList.addEventListener('dragover', (e) => {

            e.preventDefault();

            const activeElement = placesList.querySelector('.selected');

            const currentElement = e.target;

            const checkMovements = activeElement !== currentElement && currentElement.classList.contains('listItem');
            
            if (!checkMovements) return;
            
            const nextElement = getNextElement(e.clientY, currentElement);

            if (nextElement && activeElement === nextElement.previousElementSibling || activeElement === nextElement) return

            placesList.insertBefore(activeElement, nextElement);

        });



        async function geocodeCheck(request) {
            
                await ymaps.geocode(request).then(

                    function (res) {

                        var obj = res.geoObjects.get(0);

                        if (!obj) {

                            check = false;

                            console.log('некорректные данные');
                        }
                        else {

                            check = true;
                            
                            coords = obj.geometry._coordinates;

                        }

                    }).catch((err) => {check = false; console.log(err);})

        };

        map.controls.remove('geolocationControl');

        map.controls.remove('fullscreenControl');

        map.controls.remove('rulerControl');
            
        map.controls.remove('searchControl');
            
        map.controls.remove('trafficControl'); 
            
        map.controls.remove('typeSelector');
            
        map.controls.remove('fullscreenControl'); 

    }

);