const form = document.querySelector('.booking-form');
const fields = form.elements;
const enquiries = [...document.querySelectorAll('.vehicle-enquiry')];
const vehicles = enquiries.map(link => {
  const card = link.closest('article');
  const [one, roundTrip] = [...card.querySelectorAll('dd')].map(price => price.textContent);
  return {name: card.querySelector('h3').textContent, one, roundTrip};
});
const whatsapp = document.querySelector('header .button').href;

vehicles.forEach(({name}, index) => {
  fields.vehicle.add(new Option(name, String(index)));
  enquiries[index].addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    fields.vehicle.value = String(index);
    updateForm();
    location.hash = 'booking';
    fields.vehicle.focus({preventScroll: true});
  });
});

function updateForm() {
  const vehicle = vehicles[Number(fields.vehicle.value)];
  const roundTrip = fields.trip.value === 'return';
  fields.returnTime.disabled = !roundTrip;
  fields.returnTime.required = roundTrip;
  fields.returnTime.closest('label').hidden = !roundTrip;
  fields.returnTime.min = fields.pickupTime.value;
  form.querySelector('output').value = roundTrip ? vehicle.roundTrip : vehicle.one;
}

form.addEventListener('input', updateForm);
form.addEventListener('submit', event => {
  event.preventDefault();
  const pickup = fields.pickup.value.trim();
  const dropoff = fields.dropoff.value.trim();
  for (const [field, value] of [[fields.pickup, pickup], [fields.dropoff, dropoff]]) {
    if (!value) {
      field.value = '';
      field.reportValidity();
      return;
    }
  }
  const vehicle = vehicles[Number(fields.vehicle.value)];
  const roundTrip = fields.trip.value === 'return';
  const showTime = value => value.replace('T', ' ') + ' MYT';
  const details = [
    'Hi BLAX, I’d like to enquire about a KLIA transfer.',
    'Vehicle: ' + vehicle.name,
    'Trip: ' + (roundTrip ? 'Go & Back' : 'One way') + ' (' + fields.direction.value + ' for the first leg)',
    'Pickup: ' + pickup,
    'Drop-off: ' + dropoff,
    'Pickup date and time: ' + showTime(fields.pickupTime.value),
    roundTrip ? 'Return pickup: ' + showTime(fields.returnTime.value) : '',
    'Passengers: ' + fields.passengers.value,
    'Bags: ' + fields.bags.value,
    fields.notes.value.trim() ? 'Notes: ' + fields.notes.value.trim() : '',
    'Listed fare: ' + (roundTrip ? vehicle.roundTrip : vehicle.one),
    'Please confirm availability and luggage fit.'
  ];
  const destination = new URL(whatsapp);
  destination.searchParams.set('text', details.filter(Boolean).join('\n'));
  window.location.assign(destination.href);
});

updateForm();
form.hidden = false;

