// pages/main/main.js

var userDataManager = require('../../utils/UserDataManager.js')
var util = require('../../utils/util.js')
var config = require('../../config')
var timeUtil = require('../../utils/TimeUtil.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    focus: false,
    inputValue: '未打卡，点我弹出键盘',
    inputValue2:"",
    isPunch: false,
    list: []
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },
  gotoRule:function()
{
    wx.navigateTo({
      url: '../../pages/rule/rule'
    })
  },
  onClickItem: function (e) {

    var item = e.currentTarget.dataset.item;

    if (item == null || item.teamIndex == "0") {
      wx.showModal({
        title: '提示',
        content: '数据异常',
        showCancel: false,
      })
    }
    else {
      
      var tempStr = "?index=" + item.teamIndex.toString();
      console.log("tempStr:", tempStr)
      
      wx.navigateTo({
        url: '../../pages/group/group' + tempStr,
      })
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },
  updateUI:function() {
    var myPunch = userDataManager.GetTodayMyPunch();
    console.log("myPunch:",myPunch)
    var isPunch = false;
    var myDistanceStr = "";
    if (myPunch == null) {
      isPunch = true;
      myDistanceStr = "未加入跑团";
    } else {
      isPunch = myPunch.distance >= 3 ? true : false;
      myDistanceStr = isPunch ? "已跑步 " + myPunch.distance + " 公里" : "";
    }

    this.setData({
      inputValue2: myDistanceStr,
      isPunch: isPunch,
      list: userDataManager.GetAllTeamsInfo()
    })

    console.log("list:", this.data.list)
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
     this.updateUI();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) 
  {
    var timeStr = timeUtil.GetTodayMD();

    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    return {
      title: timeStr,
      path: 'pages/main/main',
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
  },
  uploadMyPunch: function (e) 
  {
    console.log("inputValue:", this.data.inputValue2);

    var myDistanceValue = parseFloat(this.data.inputValue2);
    console.log("myDistanceValue:",myDistanceValue);
    if (myDistanceValue!=null && myDistanceValue>=0)
    {
      util.showBusy('请求中...')
      var that = this
      var options = {
        url: config.service.punch,
        login: true,
        data: {
          team_key: userDataManager.m_myInfo.team_key,
          open_id: userDataManager.m_myInfo.open_id,
          punch_timestamp: timeUtil.GetTimeStamp(),
          distance: myDistanceValue
        },
        success(result) 
        {
          if (result != null && result.data != null && result.data.data != null && result.data.data.msg == "success") 
          {
            var group = result.data.data.group;
            console.log("更新本地数据:", group)

            if(group!=null)
            {
              for (var i = 0; i < group.length; i++) {
                var item = group[i];
                group[i].teams = JSON.parse(item.teams);
                group[i].members = JSON.parse(item.members);
              }
              //需要刷新本地数据
              userDataManager.SetTeamInfo(group);
              that.updateUI();

              util.showSuccess('请求成功完成')
              console.log('request success', group)
            }else{
              util.showModel('请求失败', "result.data.data.group is null");
            }

            
          } else {
            util.showModel('请求失败', result.data.data.msg);
          }
          
        },
        fail(error) {
          util.showModel('请求失败', error);
          console.log('request fail', error);
        }
      }
      if (this.data.takeSession) {  // 使用 qcloud.request 带登录态登录
        qcloud.request(options)
      } else {    // 使用 wx.request 则不带登录态
        wx.request(options)
      }
    }
    else{
      util.showModel('请求失败', "数据格式有误:" + myDistanceValue + "，例如输入:3.01");
    }
  },
  bindKeyInput: function (e) {
    this.setData({
      inputValue2: e.detail.value
    })
  }
})