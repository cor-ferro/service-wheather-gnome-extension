const Lang = imports.lang;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Soup = imports.gi.Soup;
const Mainloop = imports.mainloop;

const DAY_MAP = {
    0: 'воскресенье',
    1: 'понедельник',
    2: 'вторник',
    3: 'среда',
    4: 'четверг',
    5: 'пятница',
    6: 'суббота'
}; 

const MONTH_MAP = {
    0: 'январь',
    1: 'февраль',
    2: 'март',
    3: 'апрель',
    4: 'май',
    5: 'июнь',
    6: 'июль',
    7: 'август',
    8: 'сентябрь',
    9: 'октябрь',
    10: 'ноябрь',
    11: 'декабрь',
}; 

function printObject(obj) {
    if (!obj) {
        return;
    }

    global.log(`${obj.constructor.name} ----------`);
    const props = [];
    for (var i in obj) {
        props.push(i);
    }

    props.sort();
    props.forEach((prop) => {
        global.log(prop);
    });
    global.log('----------');
}

let _httpSession;
const WheatherIndicator = new Lang.Class({
    Name: 'WheatherIndicator',
    Extends: PanelMenu.Button,

    _init() {
        this.parent(0.0, "Wheather Indicator", false);
        this.buttonText = new St.Label({
            text: _("Loading..."),
            y_align: Clutter.ActorAlign.CENTER
        });
        this.actor.add_actor(this.buttonText);
        this._refresh();

        this.wheather = {};

        this.actor.connect('button-press-event', () => {
            const FORECAST_DAY_WIDTH = 120;

            this.menu.removeAll();

            if (this.wheather.forecast && this.wheather.forecast.length > 0) {
                // this.menu.box.set_width(FORECAST_DAY_WIDTH * this.wheather.forecast.length);

                let popupMenuExpander = new PopupMenu.PopupSubMenuMenuItem(`Прогноз на ${this.wheather.forecast.length} дней`);

                printObject(Clutter.ActorAlign);

                const wrapper = new St.BoxLayout();
                wrapper.set_vertical(true);

                this.wheather.forecast.forEach((forecast) => {
                    const date = new Date(forecast.timestamp);
                    const dayTemp = forecast.day.temp;
                    const nightTemp = forecast.night.temp;

                    const labelDay = new St.Label({text: `${DAY_MAP[date.getDay()]}`, style_class: 'forecast-day-label'});
                    const labelDate = new St.Label({text: `${MONTH_MAP[date.getMonth()]}, ${date.getDate()}`, style_class: 'forecast-day-date'});
                    const labelDayTemp = new St.Label({text: `днём:    ${dayTemp}`, style_class: 'forecast-day-day-temp'});
                    const labelNightTemp = new St.Label({text: `ночью: ${nightTemp}`, style_class: 'forecast-day-night-temp'});

                    const box = new St.BoxLayout();

                    box.set_vertical(true);
                    box.set_width(FORECAST_DAY_WIDTH);
                    box.set_height(80);
                    box.set_style_class_name('forecast-box');
                    box.add(labelDay);
                    box.add(labelDate);
                    box.add(labelDayTemp);
                    box.add(labelNightTemp);

                    wrapper.add(box);
                });

                popupMenuExpander.menu.box.add(wrapper);

                this.menu.addMenuItem(popupMenuExpander);
            }
            
            this.menu.open()
        }); 
    },

    _refresh() {
        this._loadData(this._refreshUI);
        this._removeTimeout();
        this._timeout = Mainloop.timeout_add_seconds(60, Lang.bind(this, this._refresh));
        return true;
    },

    _loadData() {
        global.log("start loadWheather");

        _httpSession = new Soup.Session();

        const lat = '59.943688';
        const lon = '30.351207';

        let message = Soup.form_request_new_from_hash('GET', `http://127.0.0.1:49160/get`, {lat, lon});

        _httpSession.queue_message(message, (_httpSession, message) => {
            global.log("queue_message loadWheather");

            if (message.status_code !== 200) {
                return;
            }

            let json = JSON.parse(message.response_body.data);

            this.wheather = json;

            this._refreshUI(json);
        });
    },

    _refreshUI(data) {
        const txt = `${data.fact.temp} (${data.feeling.temp})`;
        this.buttonText.set_text(txt);
    },

    _removeTimeout() {
        if (this._timeout) {
            Mainloop.source_remove(this._timeout);
            this._timeout = null;
        }
    },

    stop() {
        if (_httpSession !== undefined) {
            _httpSession.abort();
        }

        _httpSession = undefined;

        this._removeTimeout();

        this.menu.removeAll();
    }
});

function init() {
}

function enable() {
    wheatherMenu = new WheatherIndicator();
	Main.panel.addToStatusArea('wheather-indicator', wheatherMenu);
}

function disable() {
    wheatherMenu.stop();
	wheatherMenu.destroy();
}