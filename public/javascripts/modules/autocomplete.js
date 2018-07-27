function autocomplete(input, latInput, lngInput) {
  if (!input) return; // if no input returns
  const dropdown = new google.maps.places.Autocomplete(input);

  dropdown.addListener('place_changed', () => {
    const place = dropdown.getPlace();
    latInput.value = place.geometry.location.lat();
    lngInput.value = place.geometry.location.lng();
  });

  // don't submit form on enter when in address field
  input.on('keydown', (e) => {
    if(e.keyCode === 13) e.eventPreventDefault();
  })
}

export default autocomplete;
