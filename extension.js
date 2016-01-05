const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;

const TW_URL = 'https://transferwise.com/api/v1/payment/calculate';
const TW_AUTH_KEY = 'dad99d7d8e52c2c8aaf9fda788d8acdc';


let _httpSession;
const TransferWiseIndicator = new Lang.Class({
		Name: 'TransferWiseIndicator',
		Extends: PanelMenu.Button,

		_init: function () {
			this.parent(0.0, "Transfer Wise Indicator", false);
			this.buttonText = new St.Label({
				text: _("Loading..."),
				y_align: Clutter.ActorAlign.CENTER
			});
			this.actor.add_actor(this.buttonText);
			this._refresh();
		},

		_refresh: function () {
			this._loadData(this._refreshUI);
			this._removeTimeout();
			this._timeout = Mainloop.timeout_add_seconds(10, Lang.bind(this, this._refresh));
			return true;
		},

		_loadData: function () {
			let params = {
				amount: '1000',
				sourceCurrency: 'CHF',
				targetCurrency: 'EUR'
			};
			_httpSession = new Soup.Session();
			let message = Soup.form_request_new_from_hash('GET', TW_URL, params);
			message.request_headers.append("X-Authorization-key", TW_AUTH_KEY);
			_httpSession.queue_message(message, Lang.bind(this, function (_httpSession, message) {
						if (message.status_code !== 200)
							return;
						let json = JSON.parse(message.response_body.data);
						this._refreshUI(json);
					}
				)
			);
		},

		_refreshUI: function (data) {
			let txt = data.transferwisePayOut.toString();
			txt = txt.substring(0,6) + ' CHF';
			global.log(txt);
			this.buttonText.set_text(txt);
		},

		_removeTimeout: function () {
			if (this._timeout) {
				Mainloop.source_remove(this._timeout);
				this._timeout = null;
			}
		},

		stop: function () {
			if (_httpSession !== undefined)
				_httpSession.abort();
			_httpSession = undefined;

			if (this._timeout)
				Mainloop.source_remove(this._timeout);
			this._timeout = undefined;

			this.menu.removeAll();
		}
	}
);

let twMenu;

function init() {
}

function enable() {
	twMenu = new TransferWiseIndicator;
	Main.panel.addToStatusArea('tw-indicator', twMenu);
}

function disable() {
	twMenu.stop();
	twMenu.destroy();
}
