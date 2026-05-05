// Club definitions and last-used persistence
const CLUBS = [
  { group: 'Woods',   clubs: ['Driver', '3W', '5W'] },
  { group: 'Hybrids', clubs: ['3H', '4H', '5H'] },
  { group: 'Irons',   clubs: ['4i', '5i', '6i', '7i', '8i', '9i'] },
  { group: 'Wedges',  clubs: ['PW', 'GW', 'SW', 'LW'] },
  { group: 'Short',   clubs: ['Chip', 'Punch', 'Flop'] },
  { group: 'Putter',  clubs: ['Putter'] },
];

let lastUsedClub = localStorage.getItem('lastClub') || 'Driver';

function setLastUsedClub(club) {
  lastUsedClub = club;
  localStorage.setItem('lastClub', club);
}
