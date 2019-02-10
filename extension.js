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
            text: _("загрузка..."),
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

                    const box = new St.BoxLayout();

                    const dayTempBox = new St.BoxLayout();
                    const dayTempLabelBox = new St.BoxLayout();
                    const dayTempValueBox = new St.BoxLayout();

                    dayTempLabelBox.set_width(60);
                    dayTempLabelBox.add(new St.Label({text: `днём:`, style_class: 'forecast-day-day-temp-label'}))

                    dayTempValueBox.add(new St.Label({text: `${this.formatTemp(dayTemp)}`, style_class: 'forecast-day-day-temp-value'}))
                    
                    dayTempBox.set_vertical(false);
                    dayTempBox.add(dayTempLabelBox);
                    dayTempBox.add(dayTempValueBox);

                    const nightTempBox = new St.BoxLayout();
                    const nightTempLabelBox = new St.BoxLayout();
                    const nightTempValueBox = new St.BoxLayout();

                    nightTempLabelBox.set_width(60);
                    nightTempLabelBox.add(new St.Label({text: `ночью:`, style_class: 'forecast-day-night-temp-label'}))
                    nightTempValueBox.add(new St.Label({text: `${this.formatTemp(nightTemp)}`, style_class: 'forecast-day-night-temp-value'}))

                    nightTempBox.set_vertical(false);
                    nightTempBox.add(nightTempLabelBox);
                    nightTempBox.add(nightTempValueBox);

                    const rightColumn = new St.BoxLayout();
                    rightColumn.set_vertical(true);
                    rightColumn.add(
                        new St.Label({text: `${DAY_MAP[date.getDay()]}, ${MONTH_MAP[date.getMonth()]}`, style_class: 'forecast-day-label'})
                    );
                    rightColumn.add(
                        dayTempBox
                    );
                    rightColumn.add(
                        nightTempBox
                    );

                    const firstLineBox = new St.BoxLayout();
                    firstLineBox.set_vertical(false);
                    firstLineBox.add(
                        new St.Label({text: `${date.getDate()} `, style_class: 'forecast-day-date'})
                    )
                    firstLineBox.add(
                        rightColumn
                    );

                    box.set_vertical(true);
                    box.set_width(FORECAST_DAY_WIDTH);
                    box.set_height(75);
                    box.set_style_class_name('forecast-box');
                    box.add(
                        firstLineBox
                    );


                    wrapper.add(box);
                });

                popupMenuExpander.menu.box.add(wrapper);

                this.menu.addMenuItem(new PopupMenu.PopupMenuItem(`${this.wheather.location}, ${this.formatTemp(this.wheather.fact.temp)}\n\nветер:               ${this.wheather.fact.windSpeed};\nвлажность:   ${this.wheather.fact.humidity}`));
                this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                this.menu.addMenuItem(popupMenuExpander);
            }
            
            this.menu.open()
        }); 
    },

    formatTemp(value) {
        if (value < 0 || value > 0) {
            return `${value}°`;
        } else {
            return `0`;
        }
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
        const txt = `[ ${data.location}: ${this.formatTemp(data.fact.temp)} (${this.formatTemp(data.feeling.temp)}) ]`;
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