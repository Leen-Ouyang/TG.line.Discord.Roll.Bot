"use strict";
if (!process.env.mongoURL) {
    return;
}
const VIP = require('../modules/veryImportantPerson');
const limitAtArr = [3, 10, 50, 200, 200, 200, 200, 200];
const schema = require('../modules/schema.js');
const opt = {
    upsert: true,
    runValidators: true,
    new: true
}
var gameName = function () {
    return '【身分管理】.roleReact .roleInvites'
}

var gameType = function () {
    return 'Tool:role:hktrpg'
}
var prefixs = function () {
    return [{
        first: /^\.roleInvites$|^\.roleReact$/i,
        second: null
    }]
}
var getHelpMessage = function () {
    return `【身分管理】Discord限定功能
讓使用指定的邀請連結進入群組的受邀者
或
對指定訊息的Reaction進行點擊
就會分配指定的身分組別

示範
https://i.imgur.com/

注意: 此功能需求【編輯身分組】的權限，請確定授權。

指令列表

1.設定Reaction給予身份組
首先去User Setting=>Advanced=>開啓Developer Mode
再去Server Setting=>Roles=>新增或設定希望分配的身分組
然後對該身分組按右鍵並按COPY ID，把該ID記下來

接著，在你想要發佈該信息的地方按以下格式輸入

.roleReact add
身份組ID Emoji
[[message]]
發佈的訊息

範例
.roleReact add
232312882291231263 🎨 
123123478897792323 😁 
[[message]]
按🎨可得身分組-畫家
按😁可得身分組-大笑

2.設定指定邀請連結給予身份組

2.刪除角色
.myname delete  序號 / 名字縮寫  
刪除方式是delete 後面接上序號或名字縮寫


3.顯示角色列表
.myname show

4.使用角色發言
.me(序號/名字縮寫) 訊息
如
.me1 泉心慢慢的走到他們旁邊，伺機行動
.me造 「我接受你的挑戰」 
.me造 「我接受你的挑戰」 
[[CC 80]] 
[[立FLAG]]

支援擲骰，請使用[[]]來包著擲骰指令
    `
}
var initialize = function () {
    return "";
}

var rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    userid,
    botname,
    groupid
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    if (botname !== "Discord") {
        rply.text = '此功能只能在Discord中使用'
        return rply
    }
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        case /^\.myname+$/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            let myNames = await schema.myName.find({ userID: userid });
            if (groupid) {
                let result = showNames(myNames);
                if (typeof result == 'string') rply.text = result;
                else rply.myNames = result;
            }

            else {
                rply.text = showNamesInText(myNames);
            }
            return rply;
        }
        case /^\.myname+$/i.test(mainMsg[0]) && /^delete$/i.test(mainMsg[1]): {
            if (!mainMsg[2] || !/\d+/i.test(mainMsg[2])) {
                rply.text = '移除角色指令為 .myname delete (序號/名字縮寫) \n 如 .myname delete 0 / .myname delete 小雲'
                return rply
            }
            if (mainMsg[2].match(/\d+/)) {
                try {
                    let myNames = await schema.myName.find({ userID: userid })
                    let result = await myNames[mainMsg[2] - 1].deleteOne();
                    if (result) {
                        rply.text = `移除成功，${result.name} 已被移除`
                        return rply
                    } else {
                        rply.text = '移除出錯\n移除角色指令為 .myname delete (序號 或 名字縮寫) \n 如 .myname delete 1 / .myname delete 小雲\n序號請使用.myname show 查詢'
                        return rply
                    }
                } catch (error) {
                    console.error("移除角色失敗, inputStr: ", inputStr);
                    rply.text = '移除出錯\n移除角色指令為 .myname delete (序號 或 名字縮寫) \n 如 .myname delete 1 / .myname delete 小雲\n序號請使用.myname show 查詢'
                    return rply
                }
            }

            try {
                let myNames = await schema.myName.findOneAndRemove({ userID: userid, shortName: mainMsg[2] })

                if (myNames) {
                    rply.text = `移除成功，${myNames}`
                    return rply
                } else {
                    rply.text = '移除出錯\n移除角色指令為 .myname delete (序號/名字縮寫) \n 如 .myname delete 1 / .myname delete 小雲\n序號請使用.myname show 查詢'
                    return rply
                }
            } catch (error) {
                console.error("移除角色失敗, inputStr: ", inputStr);
                rply.text = '移除出錯\n移除角色指令為 .myname delete (序號/名字縮寫) \n 如 .myname delete 1 / .myname delete 小雲\n序號請使用.myname show 查詢'
                return rply
            }
        }
        case /^\.myname$/i.test(mainMsg[0]): {
            //.myname 泉心造史 https://example.com/example.jpg
            if (!mainMsg[2]) {
                rply.text = this.getHelpMessage();
                rply.quotes = true;
                return rply;
            }
            let lv = await VIP.viplevelCheckUser(userid);
            let limit = limitAtArr[lv];
            let myNamesLength = await schema.myName.countDocuments({ userID: userid })
            if (myNamesLength >= limit) {
                rply.text = '.myname 個人上限為' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
                rply.quotes = true;
                return rply;
            }

            let checkName = checkMyName(inputStr);
            if (!checkName || !checkName.name || !checkName.imageLink) {
                rply.text = `輸入出錯\n ${this.getHelpMessage()}`;
                return rply;
            }
            if (!checkName.imageLink.match(/^http/i)) {
                rply.text = `輸入出錯\n 圖示link 必須符合 http/https 開頭`;
                return rply;
            }
            let myName = {};
            try {
                myName = await schema.myName.findOneAndUpdate({ userID: userid, name: checkName.name }, { imageLink: checkName.imageLink, shortName: checkName.shortName }, opt)
            } catch (error) {
                rply.text = `輸入出錯\n ${this.getHelpMessage()}`;
                return rply;
            }
            rply.text = `已新增角色 - ${myName.name}`;
            let myNames = await schema.myName.find({ userID: userid })

            if (groupid) { rply.myNames = [showName(myNames, myName.name)]; }
            else {
                rply.text += showName(myNames, myName.name).content;
            }
            return rply;
        }
        case /^\.me\S+/i.test(mainMsg[0]): {
            //.myname 泉心造史 https://example.com/example.jpg
            if (!mainMsg[1]) {
                rply.text = this.getHelpMessage();
                rply.quotes = true;
                return rply;
            }
            if (!groupid) {
                rply.text = "這功能只可以在頻道中使用"
                rply.quotes = true;
                return rply;
            }
            let checkName = checkMeName(mainMsg[0]);
            if (!checkName) {
                rply.text = `輸入出錯\n ${this.getHelpMessage()} `;
                return rply;
            }
            let myName;
            if (typeof checkName == 'number') {
                let myNameFind = await schema.myName.find({ userID: userid }).skip(checkName - 1).limit(1);
                if (myNameFind) {
                    myName = myNameFind[0];
                }
            }
            if (!myName) {
                try {
                    myName = await schema.myName.findOne({ userID: userid, shortName: new RegExp(checkName, 'i') });
                } catch (error) {
                    rply.text = `輸入出錯\n ${this.getHelpMessage()} `;
                    return rply;
                }
            }
            if (!myName) {
                rply.text = `找不到角色 - ${checkName} `;
                return rply;
            }
            rply.myName = showMessage(myName, inputStr);
            return rply;
        }
        default: {
            break;
        }
    }
}

function showMessage(myName, inputStr) {
    let result = {
        content: inputStr.replace(/^\s?\S+\s+/, ''),
        username: myName.name,
        avatarURL: myName.imageLink
    }
    return result;

}


function checkMyName(inputStr) {
    let name = inputStr.replace(/^\s?\S+\s+/, '');
    let finalName = {}
    if (name.match(/^".*"/)) {
        finalName = name.match(/"(.*)"\s+(\S+)\s*(\S*)/)
    } else {
        finalName = name.match(/^(\S+)\s+(\S+)\s*(\S*)/)
    }
    return { name: finalName[1], imageLink: finalName[2], shortName: finalName[3] };
}

function checkMeName(inputStr) {
    let name = inputStr.replace(/^\.me/i, '');
    if (name.match(/^\d+$/)) {
        name = Number(name)
    }
    return name;
}




function showNames(names) {
    let reply = [];
    if (names && names.length > 0) {
        for (let index = 0; index < names.length; index++) {
            let name = names[index];
            reply[index] = {
                content: `序號#${index + 1} \n${(name.shortName) ? `安安，我的別名是${name.shortName}` : `嘻，我的名字是${name.name}`}
\n使用我來發言的指令是輸入  \n.me${index + 1} 加上你想說的話${(name.shortName) ? `\n或 \n .me${name.shortName} 加上你想說的話` : ''} `,
                username: name.name,
                avatarURL: name.imageLink
            }
        }
    } else reply = "沒有找到角色"
    return reply;
}

function showNamesInText(names) {
    let reply = '';
    if (names && names.length > 0) {
        for (let index = 0; index < names.length; index++) {
            let name = names[index];
            reply += `序號#${index + 1} \n${(name.shortName) ? `安安，我是${name.name}，我的別名是${name.shortName}` : `嘻，我的名字是${name.name}`} \n${name.imageLink} \n
\n使用我來發言的指令是輸入  \n.me${index + 1} 加上你想說的話${(name.shortName) ? `\n或 \n .me${name.shortName} 加上你想說的話` : ''} `
        }
    }
    else reply = "沒有找到角色"
    return reply;
}

function showName(names, targetName) {
    let reply = {};
    if (names && names.length > 0) {
        for (let index = 0; index < names.length; index++) {
            let name = names[index];
            if (names[index].name == targetName)
                reply = {
                    content: `序號#${index + 1} \n${(name.shortName) ? `Hello, 我的別名是${name.shortName}` : `你好，我的名字是${name.name}`} \n使用我來發言的指令是輸入  \n.me${index + 1} 加上你想說的話${(name.shortName) ? `\n或 \n .me${name.shortName} 加上你想說的話` : ''} `,
                    username: name.name,
                    avatarURL: name.imageLink
                }
        }
    } else reply = "沒有找到角色"
    return reply;
}



module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};