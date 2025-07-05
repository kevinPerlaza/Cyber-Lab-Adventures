'''
// script.js

// --- IP Address Management (Simulated ipaddress library) ---
// A simple CIDR to IP range and subnetting utility.
// Note: This is a simplified version for this specific application.

function cidrToRange(cidr) {
    const [baseIp, prefix] = cidr.split('/');
    const prefixNum = parseInt(prefix, 10);
    const ipNum = ipToLong(baseIp);
    const start = ipNum & (-1 << (32 - prefixNum));
    const end = start | ((1 << (32 - prefixNum)) - 1);
    return { start, end, prefix: prefixNum };
}

function ipToLong(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
}

function longToIp(long) {
    return [
        (long >>> 24) & 255,
        (long >>> 16) & 255,
        (long >>> 8) & 255,
        long & 255
    ].join('.');
}

function* getSubnets(networkCidr, newPrefix) {
    const net = cidrToRange(networkCidr);
    const subnetSize = 1 << (32 - newPrefix);
    for (let i = net.start; i <= net.end; i += subnetSize) {
        yield {
            networkAddress: longToIp(i),
            netmask: longToIp((-1 << (32 - newPrefix)) >>> 0),
            broadcastAddress: longToIp(i + subnetSize - 1),
            newPrefix: newPrefix,
            getIp: (offset) => longToIp(i + offset)
        };
    }
}

// --- RANDOM PROBLEM GENERATOR ---
function generarProblema() {
    // 1. Enhanced Random Parameters
    const numRouters = Math.floor(Math.random() * 4) + 2; // 2 to 5
    const protocolos = ['OSPF', 'EIGRP', 'RIPv2'];
    const protocolo = protocolos[Math.floor(Math.random() * protocolos.length)];
    const lanPrefixes = [24, 25, 26, 27];
    const lanPrefix = lanPrefixes[Math.floor(Math.random() * lanPrefixes.length)];

    const redesBaseInfo = [
        { nombre: 'Corporación Cygnus', cidr: '192.168.0.0/16', planeta: 'Planeta C-192' },
        { nombre: 'Federación de Andrómeda', cidr: '172.16.0.0/12', planeta: 'Galaxia B-172' },
        { nombre: 'Imperio Triangulum', cidr: '10.0.0.0/8', planeta: 'Universo A-10' },
        { nombre: 'Consorcio de Orión', cidr: '100.64.0.0/10', planeta: 'Nebulosa de Orión' },
    ];
    const baseInfo = redesBaseInfo[Math.floor(Math.random() * redesBaseInfo.length)];

    const subredesLan = getSubnets(baseInfo.cidr, lanPrefix);
    const subredesWan = getSubnets('200.200.200.0/24', 30);

    let problema = {
        topologia: { routers: {}, pcs: {} },
        instrucciones: [],
        clave_solucion: {},
        config_basica: {}
    };

    // 2. Build topology and assign IPs
    for (let i = 0; i < numRouters; i++) {
        const routerNombre = `R${i + 1}`;
        problema.topologia.routers[routerNombre] = { interfaces: {} };

        const numLansPorRouter = Math.floor(Math.random() * 2) + 1; // 1 or 2
        for (let j = 0; j < numLansPorRouter; j++) {
            const lanSubnetResult = subredesLan.next();
            if (lanSubnetResult.done) continue;
            const lanSubnet = lanSubnetResult.value;

            const routerIpLan = lanSubnet.getIp(1);
            const interfazRouterLan = `GigabitEthernet0/${j}`;
            problema.topologia.routers[routerNombre].interfaces[interfazRouterLan] = {
                ip: routerIpLan,
                mask: lanSubnet.netmask
            };

            const numPcsPorLan = Math.floor(Math.random() * 2) + 1; // 1 or 2
            for (let k = 0; k < numPcsPorLan; k++) {
                const pcNombre = `PC${Object.keys(problema.topologia.pcs).length}`;
                const pcIp = lanSubnet.getIp(2 + k);
                problema.topologia.pcs[pcNombre] = {
                    ip: pcIp,
                    mask: lanSubnet.netmask,
                    gateway: routerIpLan
                };
            }
        }
    }

    // Linear WAN connections
    if (numRouters > 1) {
        let wanIfaceCounter = {};
        for (let i = 0; i < numRouters - 1; i++) {
            const wanSubnet = subredesWan.next().value;
            const r1Nombre = `R${i + 1}`;
            const r2Nombre = `R${i + 2}`;
            const r1IpWan = wanSubnet.getIp(1);
            const r2IpWan = wanSubnet.getIp(2);

            const r1IfaceNum = wanIfaceCounter[r1Nombre] || 2;
            const r2IfaceNum = wanIfaceCounter[r2Nombre] || 2;

            const intfR1 = `GigabitEthernet0/${r1IfaceNum}`;
            const intfR2 = `GigabitEthernet0/${r2IfaceNum}`;

            problema.topologia.routers[r1Nombre].interfaces[intfR1] = { ip: r1IpWan, mask: wanSubnet.netmask };
            problema.topologia.routers[r2Nombre].interfaces[intfR2] = { ip: r2IpWan, mask: wanSubnet.netmask };

            wanIfaceCounter[r1Nombre] = r1IfaceNum + 1;
            wanIfaceCounter[r2Nombre] = r2IfaceNum + 1;
        }
    }

    // 3. Generate Instructions, Solution Key, and Basic Config
    problema.titulo = `Misión: ${protocolo} en la ${baseInfo.nombre}`;
    problema.instrucciones = [
        `¡Cadete! Tu misión es establecer comunicaciones para la ${baseInfo.nombre} usando ${numRouters} routers.`,
        `Utiliza el mapa de direccionamiento de la red ${baseInfo.cidr} que te hemos asignado.`,
        `Configura los nombres de host de los routers para que coincidan con su designación (ej: 'R1').`
    ];

    // Generate basic config for the helper
    for (const routerNombre in problema.topologia.routers) {
        let config = `enable
configure terminal
hostname ${routerNombre}
!
`;
        const interfaces = problema.topologia.routers[routerNombre].interfaces;
        for (const iface in interfaces) {
            const netData = interfaces[iface];
            config += `interface ${iface}
`;
            config += ` ip address ${netData.ip} ${netData.mask}
`;
            config += ` no shutdown
 exit
!
`;
        }
        problema.config_basica[routerNombre] = config;
    }

    // Protocol-specific challenges
    if (protocolo === 'OSPF') {
        const ospfId = Math.floor(Math.random() * 65534) + 1;
        const areaId = Math.floor(Math.random() * 11);
        problema.instrucciones.push(`Activa OSPF con ID de proceso ${ospfId} en todos los routers, asignando todas las redes al área ${areaId}.`);
        if (Math.random() > 0.5) {
            const routerId = `1.1.1.${Math.floor(Math.random() * 254) + 1}`;
            problema.instrucciones.push(`Para el router R1, establece manualmente el router-id a ${routerId} por motivos de estabilidad.`);
            problema.clave_solucion.extra = `router-id ${routerId}`;
        }
        problema.instrucciones.push("Asegura que las interfaces LAN no anuncien sus rutas (configúralas como pasivas).");
        problema.clave_solucion.protocolo = 'OSPF';
        problema.clave_solucion.process_id = ospfId;
        problema.clave_solucion.area = areaId;

    } else if (protocolo === 'EIGRP') {
        const eigrpAs = Math.floor(Math.random() * 65534) + 1;
        problema.instrucciones.push(`Implementa EIGRP con el Sistema Autónomo (AS) número ${eigrpAs}.`);
        if (Math.random() > 0.5) {
            problema.instrucciones.push("Desactiva la sumarización automática para evitar agujeros negros cósmicos (no auto-summary).");
            problema.clave_solucion.extra = 'no auto-summary';
        }
        problema.instrucciones.push("Aplica interfaces pasivas en las redes LAN para mayor seguridad.");
        problema.clave_solucion.protocolo = 'EIGRP';
        problema.clave_solucion.as_number = eigrpAs;

    } else if (protocolo === 'RIPv2') {
        problema.instrucciones.push("Implementa el protocolo de enrutamiento RIP versión 2.");
        problema.instrucciones.push("Asegúrate de que no se realice sumarización automática.");
        problema.instrucciones.push("Las interfaces LAN deben ser pasivas para no propagar actualizaciones RIP.");
        problema.clave_solucion.protocolo = 'RIPv2';
        problema.clave_solucion.version = 2;
    }

    problema.instrucciones.push("La prueba final: ¡lanza un ping desde una PC en una red LAN a otra en la red más lejana para confirmar la conectividad total!");
    
    return problema;
}

// --- SIMULATED VERIFICATION ENGINE ---
function verificarSolucionSimulada(archivoPkt, clave) {
    if (!archivoPkt || !archivoPkt.name.toLowerCase().endsWith('.pkt')) {
        return { correcto: false, mensaje: "¡Houston, tenemos un problema! Necesitas subir un archivo .pkt válido." };
    }

    const fname = archivoPkt.name.toLowerCase();
    const protocolo = (clave.protocolo || '').toLowerCase();

    if (!protocolo || !fname.includes(protocolo)) {
        return { correcto: false, mensaje: `Revisa el protocolo. La simulación esperaba encontrar '${protocolo}' en el nombre de tu archivo.` };
    }

    if (protocolo === 'eigrp') {
        const asNumber = clave.as_number;
        if (!fname.includes(`as${asNumber}`)) {
            return { correcto: false, mensaje: `¡Casi! Parece que tu configuración de EIGRP (AS ${asNumber}) no es correcta. Consejo: Renombra tu archivo para incluir 'eigrp' y 'as${asNumber}' para pasar esta simulación.` };
        }
    }

    if (protocolo === 'ospf') {
        const area = clave.area;
        if (!fname.includes(`area${area}`)) {
            return { correcto: false, mensaje: `¡Uy! Tu configuración de OSPF en el área ${area} necesita un ajuste. Consejo: Renombra tu archivo para incluir 'ospf' y 'area${area}' para pasar esta prueba.` };
        }
    }

    return { correcto: true, mensaje: "¡Misión Cumplida! 🚀 ¡Has conquistado la red! Tu configuración es estelar." };
}


// --- DOM MANIPULATION AND EVENT LISTENERS ---
let currentProblema = null;

function renderProblema(problema) {
    currentProblema = problema;

    // Title and Instructions
    document.getElementById('titulo-problema').innerText = problema.titulo;
    const instructionsList = document.getElementById('lista-instrucciones');
    instructionsList.innerHTML = '';
    problema.instrucciones.forEach(inst => {
        const li = document.createElement('li');
        li.innerText = inst;
        instructionsList.appendChild(li);
    });

    // Routers Table
    const routersTbody = document.getElementById('routers-tbody');
    routersTbody.innerHTML = '';
    Object.keys(problema.topologia.routers).sort().forEach(router => {
        Object.keys(problema.topologia.routers[router].interfaces).sort().forEach(iface => {
            const data = problema.topologia.routers[router].interfaces[iface];
            const row = routersTbody.insertRow();
            row.innerHTML = `<td>${router}</td><td>${iface}</td><td>${data.ip}</td><td>${data.mask}</td>`;
        });
    });

    // PCs Table
    const pcsTbody = document.getElementById('pcs-tbody');
    pcsTbody.innerHTML = '';
    Object.keys(problema.topologia.pcs).sort().forEach(pc => {
        const data = problema.topologia.pcs[pc];
        const row = pcsTbody.insertRow();
        row.innerHTML = `<td>${pc}</td><td>${data.ip}</td><td>${data.mask}</td><td>${data.gateway}</td>`;
    });

    // Hide helper and result
    document.getElementById('config-helper').style.display = 'none';
    document.getElementById('resultado').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const btnNuevoDesafio = document.getElementById('btn-nuevo-desafio');
    const btnAyuda = document.getElementById('btn-ayuda');
    const formSolucion = document.getElementById('form-solucion');
    const resultadoDiv = document.getElementById('resultado');
    const configHelperDiv = document.getElementById('config-helper');
    const configOutputDiv = document.getElementById('config-output');

    btnNuevoDesafio.addEventListener('click', (e) => {
        e.preventDefault();
        renderProblema(generarProblema());
    });

    btnAyuda.addEventListener('click', () => {
        if (!currentProblema) return;
        
        configHelperDiv.style.display = 'block';
        let formattedConfig = '';
        for (const router in currentProblema.config_basica) {
            formattedConfig += `--- CONFIGURACIÓN PARA ${router} ---
`;
            formattedConfig += currentProblema.config_basica[router];
            formattedConfig += `-------------------------------------

`;
        }
        configOutputDiv.innerText = formattedConfig;
    });

    formSolucion.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!currentProblema) return;

        const archivoPkt = document.getElementById('archivo_pkt').files[0];
        const resultado = verificarSolucionSimulada(archivoPkt, currentProblema.clave_solucion);

        resultadoDiv.style.display = 'block';
        resultadoDiv.innerText = resultado.mensaje;
        resultadoDiv.className = resultado.correcto ? 'correcto' : 'incorrecto';
    });

    // Initial load
    renderProblema(generarProblema());
});
''