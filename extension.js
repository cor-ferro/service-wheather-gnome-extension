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
const ModalDialog = imports.ui.modalDialog;

let text, button;

const WheatherMenu = new Lang.Class({
    Name: 'WheatherMenu',
    Extends: PopupMenu.PopupSubMenuMenuItem,

    _init() {
        // this.parent({
        //     destroyOnClose: true
        // });

        // this._dialogLayout = 
        //     typeof this.dialogLayout === "undefined"
        //     ? this._dialogLayout
        //     : this.dialogLayout;

        // this._dialogLayout.set_style_class_name('');
        // this._dialogLayout.set_margin_bottom(300);
        // this.contentLayout.set_style_class_name('wheather-dialog');

        // this.testLabel = new St.Label({
        //     style_class: 'wheather-label',
        //     text: 'test label'
        // });

        // this.contentLayout.add(this.testLabel);

        // this._dialogLayout.set_width(200);
        // this._dialogLayout.set_height(200);

        // Main.panel._rightBox.insert_child_at_index(this.contentLayout, 0);
    }
});
    

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

        this.wheatherMenu = new WheatherMenu();
        
        let popupMenuExpander = new PopupMenu.PopupSubMenuMenuItem('PopupSubMenuMenuItem');

		// This is an example of PopupMenuItem, a menu item. We will use this to add as a submenu
		let submenu = new PopupMenu.PopupMenuItem('PopupMenuItem');

		// A new label
		let label = new St.Label({text:'Item 1'});

		// Add the label and submenu to the menu expander
		popupMenuExpander.menu.addMenuItem(submenu);
		popupMenuExpander.menu.box.add(label);
		
		// The CSS from our file is automatically imported
		// You can add custom styles like this
		// REMOVE THIS AND SEE WHAT HAPPENS
        popupMenuExpander.menu.box.style_class = 'PopupSubMenuMenuItemStyle';
        popupMenuExpander.menu.box.set_width(500);
		
		// Other standard menu items
		let menuitem = new PopupMenu.PopupMenuItem('PopupMenuItem');
		let switchmenuitem = new PopupMenu.PopupSwitchMenuItem('PopupSwitchMenuItem');
		let imagemenuitem = new PopupMenu.PopupImageMenuItem('PopupImageMenuItem', 'system-search-symbolic');		

		// Assemble all menu items
		this.menu.addMenuItem(popupMenuExpander);
		// This is a menu separator
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		this.menu.addMenuItem(menuitem);
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		this.menu.addMenuItem(switchmenuitem);
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addMenuItem(imagemenuitem);
        
        

        this.actor.connect('button-press-event', () => {
            global.log('open wheather menu');
            // this.wheatherMenu.open();
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

        let message = Soup.form_request_new_from_hash('GET', 'http://127.0.0.1:49160/actual', {});

        // execute the request and define the callback
        _httpSession.queue_message(message, (_httpSession, message) => {
            global.log("queue_message loadWheather");

            if (message.status_code !== 200) {
                return;
            }

            let json = JSON.parse(message.response_body.data);
            // do something with the data

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
	Main.panel.addToStatusArea('tw-indicator', wheatherMenu);
}

function disable() {
    wheatherMenu.stop();
	wheatherMenu.destroy();
}