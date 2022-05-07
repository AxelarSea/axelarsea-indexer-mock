const axios = require('axios');
const db = require('./config/db')
const Collection = require("./models/Collections");
const ethers = require('ethers');

const chainInfoList = {
  ropsten: {
    url: "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    id: 3,
    lastestBlock: 0,
    reverseBlock: 6
  },
  polygontestnet: {
    url: "https://matic.getblock.io/testnet/?api_key=a73d4ec1-75e4-43aa-bfa9-70641f03506a",
    id: 80001,
    lastestBlock: 0,
    reverseBlock: 6
  },
  avaxtestnet: {
    url: "https://api.avax-test.network/ext/bc/C/rpc",
    id: 43113,
    lastestBlock: 0,
    reverseBlock: 6
  },
  fantomtestnet: {
    url: "https://rpc.testnet.fantom.network/",
    id: 4002,
    lastestBlock: 0,
    reverseBlock: 6
  },
  moonbeamtestnet: {
    url: "https://rpc.testnet.moonbeam.network/",
    id: 1287,
    lastestBlock: 0,
    reverseBlock: 6
  },
}

let collectionList = [];

async function main(){
  await db.connectDB();
  collectionList = await getCollectionFromDB();
  setInterval(async function() {
    try{
      await fetchData();
    }catch(e){
      console.error(e);
    }
  }, 5000);
}

main().catch()

async function getCollectionFromDB(){
  let collectionList = await Collection.find();
  let collectionAddressList = [];
  for (let i = 0; i < collectionList.length; i++) {
    collectionAddressList.push(collectionList[i].contractAddress);
  }
  return collectionAddressList
}

async function fetchData(){
  for (const chainInfo in chainInfoList) {
    const chain = chainInfoList[chainInfo];
    let rpcLogList = await getRPCLogs(chain);

    // flter data
    rpcLogList = rpcLogList.reduce((unique, o) => {
      if(!unique.some(obj => obj.address === o.address && obj.data === o.data && obj.topics[2] === o.topics[2]) && collectionList.includes(o.address)) {
        unique.push(o);
      }
      return unique;
    },[]);

    // loop send data
    for (let i = 0; i < rpcLogList.length; i++) {
      const log = await mapRPCLogToRequestMetaData(rpcLogList[i],chain.id);
      if(!isNaN(log.id)){
        await sendLogToAxelarseaMetadata(log);
      }
    }
  }
}

async function getRPCLastestBlock(chainInfo){
  const req = {
    "jsonrpc": "2.0",
    "method": "eth_blockNumber",
    "id": 0
  }

  const data = await callPost(chainInfo.url,req);
  return data.result;
}

async function getRPCLogs(chainInfo){
  // get lastest block
  const newLastestBlock = await getRPCLastestBlock(chainInfo);
  if (newLastestBlock !== chainInfo.lastestBlock){
    const fromBlock = '0x'+(parseInt(chainInfo.lastestBlock === 0 ? newLastestBlock : chainInfo.lastestBlock, 16) - chainInfo.reverseBlock).toString(16)
    const topic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    console.log('block: '+fromBlock+' to '+ newLastestBlock);
    const req = {
        "jsonrpc": "2.0",
        "method": "eth_getLogs",
        "params": [
            {
                "fromBlock": fromBlock,
                "toBlock": newLastestBlock,
                "topics": [
                  topic
                ]
            }
        ],
        "id": 0
    };

    const data = await callPost(chainInfo.url,req);

    // set new lastest block
    chainInfo.lastestBlock = newLastestBlock;
    return data.result;
  }else{
    return [];
  }
}

async function mapRPCLogToRequestMetaData(data,chainId){
  const owner = ethers.utils.getAddress('0x'+(data.topics[2].substring((data.topics[2].length-40))));
  let result = {
    address: data.address,
    chainId: chainId,
    id: parseInt(data.data, 16).toString(),
    body: {
      "owner": owner
    }
  };
  return result;
}

async function callPost(url, body){
  return await axios.post(url,body).then(resp => {
    return resp.data
  });
}

async function sendLogToAxelarseaMetadata(req){
  const url = `${process.env.AXELARSEA_URL}/nft/collections/${req.address}/${req.chainId}/items/${req.id}/refreshMetadata`;
  console.log('sendLogToAxelarseaMetadata: '+  `/nft/collections/${req.address}/${req.chainId}/items/${req.id}/refreshMetadata`+ " | owner: "+ JSON.stringify(req.body.owner));
  await callPost(url, req.body)
}
