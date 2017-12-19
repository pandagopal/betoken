// Generated by CoffeeScript 2.0.2
var Web3, betoken, betoken_addr, cyclePhase, displayedKairoBalance, kairoBalance, kairoTotalSupply, totalFunds, userAddress, web3;

import './body.html';

import './body.css';

import './tablesort.js';

import {
  Betoken
} from '../objects/betoken.js';

import Chart from 'chart.js';

import BigNumber from 'bignumber.js';

//Import web3
Web3 = require('web3');

web3 = window.web3;

if (typeof web3 !== void 0) {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

betoken_addr = "";

betoken = new Betoken(betoken_addr);

userAddress = new ReactiveVar("");

kairoBalance = new ReactiveVar(BigNumber(""));

kairoTotalSupply = new ReactiveVar(BigNumber(""));

displayedKairoBalance = new ReactiveVar(BigNumber(""));

cyclePhase = new ReactiveVar(0);

totalFunds = new ReactiveVar(BigNumber(""));

$('document').ready(function() {
  var ctx, myChart;
  $('.menu .item').tab();
  $('table').tablesort();
  ctx = document.getElementById("myChart");
  return myChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: "ROI Per Cycle",
          backgroundColor: 'rgba(0, 0, 100, 0.5)',
          borderColor: 'rgba(0, 0, 100, 1)',
          data: [
            {
              x: 1,
              y: 10
            },
            {
              x: 2,
              y: 13
            },
            {
              x: 3,
              y: 20
            }
          ]
        }
      ]
    },
    options: {
      scales: {
        xAxes: [
          {
            type: 'linear',
            position: 'bottom',
            scaleLabel: {
              display: true,
              labelString: 'Investment Cycle'
            },
            ticks: {
              stepSize: 1
            }
          }
        ],
        yAxes: [
          {
            type: 'linear',
            position: 'left',
            scaleLabel: {
              display: true,
              labelString: 'Percent'
            },
            ticks: {
              beginAtZero: true
            }
          }
        ]
      }
    }
  });
});

Template.body.onCreated(function() {
  return betoken.getCurrentAccount().then(function(_userAddress) {
    return userAddress.set(_userAddress);
  }).then(function() {
    return betoken.getKairoBalance(userAddress.get());
  }).then(function(_kairoBalance) {
    kairoBalance.set(BigNumber(_kairoBalance));
    return displayedKairoBalance.set(BigNumber(web3.util.fromWei(_kairoBalance, "ether")).toFormat(4));
  }).then(function() {
    return betoken.getKairoTotalSupply();
  }).then(function(_kairoTotalSupply) {
    return kairoTotalSupply.set(BigNumber(_kairoTotalSupply));
  });
});

Template.phase_indicator.helpers({
  phase_active: function(index) {
    var isActive;
    isActive = new ReactiveVar("");
    betoken.getPrimitiveVar("cyclePhase").then(function(_result) {
      cyclePhase.set(+_result);
      if (+_result === index) {
        return isActive.set("active");
      }
    });
    return isActive.get();
  }
});

Template.sidebar.helpers({
  user_address: function() {
    return userAddress.get();
  },
  user_balance: function() {
    var balance;
    balance = new ReactiveVar("");
    betoken.getMappingOrArrayItem("balanceOf", userAddress.get()).then(function(result) {
      return balance.set(BigNumber(web3.util.fromWei(result, "ether")).toFormat(4));
    });
    return balance.get();
  },
  user_kairo_balance: function() {
    return displayedKairoBalance.get();
  }
});

Template.sidebar.events({
  "click .kairo_unit_switch": function(event) {
    if (this.checked) {
      //Display proportion
      return displayedKairoBalance.set(kairoBalance.get().dividedBy(kairoTotalSupply.get()).times(100).toFormat(4));
    } else {
      //Display Kairo
      return displayedKairoBalance.set(BigNumber(web3.util.fromWei(kairoBalance.get(), "ether")).toFormat(4));
    }
  }
});

Template.transact_box.onCreated(function() {
  this.depositInputHasError = new ReactiveVar(false);
  return this.withdrawInputHasError = new ReactiveVar(false);
});

Template.transact_box.helpers({
  is_disabled: function() {
    if (cyclePhase.get() !== 0) {
      return "disabled";
    }
    return "";
  },
  has_error: function(input_id) {
    if (input_id === 0) {
      if (this.depositInputHasError.get()) {
        return "error";
      }
    } else {
      if (this.withdrawInputHasError.get()) {
        return "error";
      }
    }
    return "";
  }
});

Template.transact_box.events({
  "click .deposit_button": function(event) {
    var amount;
    try {
      this.depositInputHasError.set(false);
      amount = BigNumber(web3.util.toWei(document.getElementById("deposit_input").value));
      return betoken.deposit(amount);
    } catch (error) {
      return this.depositInputHasError.set(true);
    }
  },
  "click .withdraw_button": function(event) {
    var amount;
    try {
      this.withdrawInputHasError.set(false);
      amount = BigNumber(web3.util.toWei(document.getElementById("deposit_input").value));
      return betoken.withdraw(amount);
    } catch (error) {
      return this.depositInputHasError.set(true);
    }
  }
});

Template.stats_tab.onCreated(function() {
  return betoken.getPrimitiveVar("totalFunds").then(function(_totalFunds) {
    return totalFunds.set(BigNumber(_totalFunds));
  });
});

Template.proposals_tab.helpers({
  proposal_list: function() {
    var proposals, reactive_proposals;
    reactive_proposals = new ReactiveVar([]);
    proposals = [];
    betoken.getArray("proposals").then(function(_proposals) {
      var allPromises, i, j, ref;
      //Get all proposals
      allPromises = [];
      for (i = j = 0, ref = _proposals.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
        if (_proposals[i].numFor > 0) {
          allPromises.push(betoken.getMappingOrArrayItem("forStakedControlOfProposal", i).then(function(_stake) {
            var investment, proposal;
            investment = BigNumber(_stake).dividedBy(kairoTotalSupply.get()).times(web3.util.fromWei(totalFunds.get()));
            proposal = {
              id: i,
              token_symbol: _proposals[i].tokenSymbol,
              investment: investment.toFormat(4),
              supporters: _proposals[i].numFor
            };
            return proposals.push(proposal);
          }));
        }
      }
      return Promise.all(allPromises);
    }).then(function() {
      reactive_proposals.set(proposals);
    });
    return reactive_proposals.get();
  }
});

Template.proposals_tab.events({
  "click .stake_button": function(event) {
    var kairoAmountInWeis;
    try {
      kairoAmountInWeis = BigNumber(web3.util.toWei(document.getElementById("stake_input_" + this.id).value));
      return betoken.supportProposal(this.id, kairoAmountInWeis);
    } catch (error) {

    }
  },
  //Todo:Display error message
  "click .stake_button_new": function(event) {
    var address, kairoAmountInWeis, tickerSymbol;
    try {
      address = document.getElementById("address_input_new").value;
      tickerSymbol = document.getElementById("ticker_input_new").value;
      kairoAmountInWeis = BigNumber(web3.util.toWei(document.getElementById("stake_input_new").value));
      return betoken.createProposal(address, tickerSymbol, kairoAmountInWeis);
    } catch (error) {

    }
  }
});

//Todo:Display error message
Template.members_tab.helpers({
  member_list: function() {
    var list, reactive_list;
    reactive_list = new ReactiveVar([]);
    list = [];
    betoken.getArray("participants").then(function(_array) {
      var i, j, ref;
      //Get member addresses
      list = new Array(_array.length);
      for (i = j = 0, ref = _array.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
        list[i].address = _array[i];
      }
    }).then(function() {
      var allPromises, j, len, member;
      //Get member ETH balances
      allPromises = [];
      for (j = 0, len = list.length; j < len; j++) {
        member = list[j];
        allPromises.push(web3.eth.getBalance(member.address).then(function(_eth_balance) {
          member.eth_balance = BigNumber(web3.util.fromWei(_eth_balance, "ether")).toFormat(4);
        }));
      }
      return Promise.all(allPromises);
    }).then(function() {
      var allPromises, j, len, member;
      //Get member KRO balances
      allPromises = [];
      for (j = 0, len = list.length; j < len; j++) {
        member = list[j];
        allPromises.push(betoken.getKairoBalance(member.address).then(function(_kro_balance) {
          member.kro_balance = BigNumber(web3.util.fromWei(_kro_balance, "ether")).toFormat(4);
        }));
      }
      return Promise.all(allPromises);
    }).then(function() {
      var j, len, member;
      //Get member KRO proportions
      for (j = 0, len = list.length; j < len; j++) {
        member = list[j];
        member.kro_proportion = member.kro_balance.dividedBy(web3.util.fromWei(kairoTotalSupply.get(), "ether")).times(100).toPrecision(4);
      }
    }).then(function() {
      //Update reactive_list
      return reactive_list.set(list);
    });
    return reactive_list.get();
  }
});
