// =============================================================================
//                                  配置
// =============================================================================

// 检查浏览器是否已安装以太坊钱包（如 MetaMask）
if (typeof window.ethereum !== 'undefined') {
    // 使用浏览器的以太坊提供者
    var web3 = new Web3(window.ethereum);
    try {
        // 请求用户授权
        window.ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
        console.error("用户拒绝了授权");
    }
} else {
    // 使用本地 Ganache 提供者
    var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

// 设置默认账户（第一个账户）
var defaultAccount;
web3.eth.getAccounts().then(function(accounts){
    if (accounts.length > 0) {
        web3.eth.defaultAccount = accounts[0];
        defaultAccount = accounts[0];
        updateAccountInfo();
        populateAccounts(accounts);
        populateWalletAddresses(accounts);
        populateUsers();
    } else {
        console.error("没有可用的账户");
    }
});

// 我们稍后使用的常量
var GENESIS = '0x0000000000000000000000000000000000000000';

// 这是你的合约的 ABI（从 Remix 的 'Compile' 标签中获取）
var abi =[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "creditor",
				"type": "address"
			},
			{
				"internalType": "uint32",
				"name": "amount",
				"type": "uint32"
			}
		],
		"name": "add_IOU",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "debtor",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "creditor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint32",
				"name": "amount",
				"type": "uint32"
			}
		],
		"name": "IOUAdded",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "getUsers",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "debtor",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "creditor",
				"type": "address"
			}
		],
		"name": "lookup",
		"outputs": [
			{
				"internalType": "uint32",
				"name": "",
				"type": "uint32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "lookup_table",
		"outputs": [
			{
				"internalType": "uint32",
				"name": "",
				"type": "uint32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "users",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]; // 用您的合约的 ABI 填充此处

// 创建合约实例（Web3.js v1.x 方法）
var contractAddress = '0x81B596BaE8921560eD64B8fB8936533f1b915fdE'; // 用您的合约地址替换
var BlockchainSplitwise = new web3.eth.Contract(abi, contractAddress);

// =============================================================================
//                            待实现的函数
// =============================================================================

// 返回系统中所有用户（债权人或债务人）的列表
async function getUsers() {
    try {
        const usersList = await BlockchainSplitwise.methods.getUsers().call();
        return usersList;
    } catch (error) {
        console.error("获取用户列表失败:", error);
        return [];
    }
}

// 查询债务金额
async function lookup(debtor, creditor) {
    try {
        const amount = await BlockchainSplitwise.methods.lookup(debtor, creditor).call();
        return parseInt(amount);
    } catch (error) {
        console.error(`查询 ${debtor} 欠 ${creditor} 的金额失败:`, error);
        return 0;
    }
}

// 获取指定用户 'user' 所欠的总金额
async function getTotalOwed(user) {
    let owedAmount = 0;
    const usersList = await getUsers();
    for (let i = 0; i < usersList.length; i++) {
        const amount = await lookup(user, usersList[i]);
        owedAmount += amount;
    }
    return owedAmount;
}

// 获取用户最后一次发送或接收 IOU 的时间（基于事件监听）
async function getLastActive(user) {
    try {
        // 获取用户作为债务人的事件
        const debtorEvents = await BlockchainSplitwise.getPastEvents('IOUAdded', {
            filter: { debtor: user },
            fromBlock: 0,
            toBlock: 'latest'
        });

        // 获取用户作为债权人的事件
        const creditorEvents = await BlockchainSplitwise.getPastEvents('IOUAdded', {
            filter: { creditor: user },
            fromBlock: 0,
            toBlock: 'latest'
        });

        // 合并两个事件数组
        const allEvents = debtorEvents.concat(creditorEvents);

        if (allEvents.length === 0) {
            return null;
        }

        // 按照区块号排序，找到最新的事件
        allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
        const latestEvent = allEvents[0];
        const block = await web3.eth.getBlock(latestEvent.blockNumber);
        return block.timestamp;
    } catch (error) {
        console.error("获取最后活跃时间失败:", error);
        return null;
    }
}

// 向系统添加一个 IOU（“我欠你”）
async function add_IOU(creditor, amount) {
    try {
        const accounts = await web3.eth.getAccounts();
        const debtor = accounts[0];

        // 验证债权人地址不与债务人地址相同
        if (creditor.toLowerCase() === debtor.toLowerCase()) {
            alert("债权人地址不能与债务人地址相同！");
            return;
        }

        // 验证债权人地址格式
        if (!web3.utils.isAddress(creditor)) {
            alert("无效的债权人地址！");
            return;
        }

        // 验证金额
        const amountInt = parseInt(amount);
        if (isNaN(amountInt) || amountInt <= 0) {
            alert("金额必须是大于 0 的数字！");
            return;
        }

        // 发送交易
        await BlockchainSplitwise.methods.add_IOU(creditor, amountInt)
            .send({ from: debtor, gas: 300000 })
            .on('receipt', function(receipt){
                console.log('交易成功:', receipt);
                updateAccountInfo();
                populateUsers();
            })
            .on('error', function(error){
                console.error('交易失败:', error);
                alert("添加 IOU 失败：" + error.message);
            });
    } catch (error) {
        console.error("添加 IOU 失败:", error);
        alert("添加 IOU 失败：" + error.message);
    }
}

// 获取邻居用户（欠款对象）
async function getNeighbors(user) {
    const usersList = await getUsers();
    let neighbors = [];
    for (let i = 0; i < usersList.length; i++) {
        const debt = await lookup(user, usersList[i]);
        if (debt > 0) {
            neighbors.push(usersList[i]);
        }
    }
    return neighbors;
}

// =============================================================================
//                                      用户界面
// =============================================================================

// 时间转换函数

function timeConverter(UNIX_timestamp){
    if (!UNIX_timestamp) return "invalid date";
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
}

// 更新账户信息
async function updateAccountInfo() {
    const account = web3.eth.defaultAccount;
    if (!account) {
        console.error("未找到默认账户");
        return;
    }
    const totalOwed = await getTotalOwed(account);
    const lastActive = await getLastActive(account);
    $("#total_owed").html("$" + totalOwed);
    $("#last_active").html(timeConverter(lastActive));
    $("#debtor_address").html(account); // 显示债务人地址
}

// 填充账户选项
function populateAccounts(accounts) {
    const opts = accounts.map(function (a) { return '<option value="'+a+'">'+a+'</option>' }).join('');
    $("#myaccount").html(opts);
}

// 填充钱包地址列表
function populateWalletAddresses(accounts) {
    const listItems = accounts.map(function (a) { return '<li>'+a+'</li>' }).join('');
    $(".wallet_addresses").html(listItems);
}

// 填充所有用户列表
async function populateUsers() {
    const usersList = await getUsers();
    const listItems = usersList.map(function (u,i) { return "<li>"+u+"</li>" }).join('');
    $("#all_users").html(listItems);
}

// 当页面加载完成后更新信息
$(document).ready(async function() {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length > 0) {
        populateAccounts(accounts);
        populateWalletAddresses(accounts);
        populateUsers();
    }

    // 账户切换事件
    $("#myaccount").change(async function() {
        const selectedAccount = $(this).val();
        web3.eth.defaultAccount = selectedAccount;
        await updateAccountInfo();
    });

    // 当点击添加 IOU 按钮时运行 'add_IOU' 函数
    $("#addiou").click(function() {
        const creditor = $("#creditor").val();
        const amount = $("#amount").val();
        add_IOU(creditor, amount);
    });

    // 监听 IOUAdded 事件，实时更新用户界面
    BlockchainSplitwise.events.IOUAdded({
        fromBlock: 'latest'
    }, function(error, event){ 
        if (error) {
            console.error("事件监听错误:", error);
            return;
        }
        console.log("IOUAdded 事件:", event);
        updateAccountInfo();
        populateUsers();
    });
});

// 日志函数（可选）
function log(description, obj) {
    $("#log").html($("#log").html() + description + ": " + JSON.stringify(obj, null, 2) + "<br><br>");
}
