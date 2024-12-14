'use strict';
'require baseclass';
'require rpc';

var callLuciETHInfo = rpc.declare({
  object: 'luci',
  method: 'getETHInfo',
  expect: { '': {} }
});

var callLuciNetworkDevices = rpc.declare({
  object: 'luci-rpc',
  method: 'getNetworkDevices',
  expect: { '': {} }
});

function formatSpeed(speed) {
  if (speed == '-') return '-';
  const speedNum = parseInt(speed);
  return speedNum < 1000 ? `${speedNum} M` : `${speedNum / 1000} GbE`;
}

function getPortColor(link, duplex) {
  if (link == 'no') return 'background-color: whitesmoke;';
  const color = duplex == 'Full' ? 'greenyellow' : 'darkorange';
  return 'background-color: ' + color;
}

function getPortIcon(link) {
  return L.resource(`icons/port_${link == 'yes' ? 'up' : 'down'}.png`);
}

return L.Class.extend({
  title: _('Ethernet Information'),

  load: function () {
    return Promise.all([
      L.resolveDefault(callLuciETHInfo(), {}),
      L.resolveDefault(callLuciNetworkDevices(), {})
    ]);
  },

  render: function (data) {
    const ethinfo = Array.isArray(data[0].ethinfo) ? data[0].ethinfo : [];
    const netdevs = typeof data[1] === 'object' ? data[1] : {};

    const boxStyle = 'max-width: 100px;';
    const boxHeadStyle =
      'border-radius: 7px 7px 0 0;' +
      'text-align: center;' +
      'font-size:1.1rem; font-weight:bold;';
    const boxbodyStyle =
      'border: 1px solid lightgrey;' +
      'border-radius: 0 0 7px 7px;' +
      'display:flex; flex-direction: column;' +
      'align-items: center; justify-content:center;';
    const iconStyle = 'margin: 5px; width: 40px;';
    const speedStyle = 'font-size:0.8rem; font-weight:bold;';
    const trafficStyle =
      'border-top: 1px solid lightgrey;' + 'font-size:0.8rem;';

    const ethPorts = [];
    for (const port of ethinfo) {
      const portName = port.name;
      const portIcon = getPortIcon(port.status);
      const portColor = getPortColor(port.status, port.duplex);
      const { tx_bytes, rx_bytes } = netdevs[portName].stats;
      const portDiv = E('div', { style: boxStyle }, [
        E('div', { style: boxHeadStyle + portColor }, portName),
        E('div', { style: boxbodyStyle }, [
          E('img', { style: iconStyle, src: portIcon }),
          E('div', { style: speedStyle }, formatSpeed(port.speed)),
          E('div', { style: trafficStyle }, [
            '\u25b2\u202f%1024.1mB'.format(tx_bytes),
            E('br'),
            '\u25bc\u202f%1024.1mB'.format(rx_bytes)
          ])
        ])
      ]);
      if (portName == 'wan') {
        ethPorts.unshift(portDiv);
      } else {
        ethPorts.push(portDiv);
      }
    }

    const gridStyle =
      'display:grid; grid-gap: 5px 5px;' +
      'grid-template-columns:repeat(auto-fit, minmax(70px, 1fr));' +
      'margin-bottom:1em';
    return E('div', { style: gridStyle }, ethPorts);
  }
});
