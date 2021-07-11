//import { Workbook } from '../../../lib/excel.mjs';
//import { Ajax } from '../../../lib/ajax.mjs';

const UUID = {
    create(value) {
        const pattern = 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx';
        return value = value || pattern.replace(/[xMN]/g, c => {
            switch (c) {
                case 'x':
                    return (Math.random() * 16 & 0xf).toString(16);
                    break;
                case 'M':
                    return '4';
                    break;
                case 'N':
                    return (Math.random() * 16 & 3 | 0x8).toString(16);
                    break;
            }
        });
    }
}

function load(url) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', url);
        request.onload = () => resolve(request.responseText);
        request.onerror = () => reject(request.statusText);
        request.send();
    });
}

function loadXML(url) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', url);
        request.onload = () => resolve(request.responseXML);
        request.onerror = () => reject(request.statusText);
        request.send();
    });
}

function save(url, content) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('PUT', url);
        request.onload = () => resolve(request.responseText);
        request.onerror = () => reject(request.statusText);
        request.send(content);
    });
}

function getCSSRule(ruleName) {
    ruleName = ruleName.toLowerCase();
    var result = null;
    const find = Array.prototype.find;

    find.call(document.styleSheets, styleSheet => {
        result = find.call(styleSheet.cssRules, cssRule => {
            return cssRule instanceof CSSStyleRule &&
                cssRule.selectorText.toLowerCase() == ruleName;
        });
        return result != null;
    });
    return result;
}


function setOverlayText(text) {
    const element = document.getElementById('text-overlay');
    element.innerHTML = text;
    element.classList.remove('fade');
}

function clearOverlayText() {
    const element = document.getElementById('text-overlay');
    //element.innerHTML = '';
    element.classList.add('fade');
}

/**
 * Make a node editable when doule clicked.
 * 
 * @param node - Node to make editable
 * @param action - action to perform following edit
 * @param action - action to perform following edit
 * @param cancel - action to perform if edit cancelled
 */
function doubleClickEdit(node, action, cancel) {
    node.addEventListener('dblclick', (event) => {
        node.contentEditable = true;
        node.focus();
    });
    node.addEventListener('blur', (event) => {
        action(node, event);
        node.contentEditable = false;
    });
    node.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            action(node, event);
            node.contentEditable = false;
        } else if (event.key === 'Escape') {
            cancel(node, event);
            node.contentEditable = false;
        }
    });
}

function debug(text) {
    const debugNode = document.getElementById('debug');
    if (debugNode) {
        debugNode.style.display = 'block';
        const item = document.createElement('div');
        debugNode.appendChild(item);
        item.innerHTML = `${(new Date()).toLocaleTimeString()}: ${text}`;
        item.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
    }
}

/**
 * Make a node draggable on touch devices
 *
 */
function makeDraggable(element, dragstart = () => undefined) {
    let target;
    const dragover = (event, data) => {
        const targets = document.elementsFromPoint(event.touches[0].clientX, event.touches[0].clientY);
        const dropTargets = targets.filter((element) => element.dataset.dropTarget);
        target = undefined;
        if (dropTargets.length > 0) {
            const touchdragover = new CustomEvent('touchdragover', { detail: data });
            dropTargets[0].dispatchEvent(touchdragover);
            target = dropTargets[0];
        }
    };
    const dragend = (event, data) => {
        for (const input of document.querySelectorAll('.widget-input')) {
            input.classList.remove('show');
        }
        if (target) {
            const touchdrop = new CustomEvent('touchdrop', { detail: data });
            target.dispatchEvent(touchdrop);
        }
    };

    element.addEventListener('touchstart', (event) => {
        event.preventDefault();
        const data = {};
        dragstart(event, data);
        const dragging = element.cloneNode(true);
        document.body.appendChild(dragging);
        dragging.classList.add('dragging');
        dragging.style.left = `${event.touches[0].screenX}px`;
        dragging.style.top = `${event.touches[0].screenY - 2 * event.touches[0].radiusY}px`;
        dragging.style.bottom = 'unset';

        const move = (event) => {
            dragging.style.left = `${event.touches[0].screenX}px`;
            dragging.style.top = `${event.touches[0].screenY - 2 * event.touches[0].radiusY}px`;
            dragover(event, data);
        }
        document.body.addEventListener('touchmove', move);
        document.body.addEventListener('touchend', (event) => {
            document.body.removeEventListener('touchmove', move);
            document.body.removeChild(dragging);
            dragend(event, data);
        });
    });
}


const WidgetStates = {
    normal: {
        viewState: 'normal',
        /**
         * Restore the elements to the normal widget state.
         */
        enterState() {
            /*
            this.docElement.classList.remove('hidden');
            this.docElement.querySelector('.widget-content').classList.remove('hidden');
            */
            this.docElement.style.left = `${this.config.normal.x}px`;
            this.docElement.style.top = `${this.config.normal.y}px`;
            this.docElement.style.width = `${this.config.normal.width}px`;
            this.docElement.style.height = `${this.config.normal.height}px`;
            this.showInputs();
            this.showOutputs();
        },
        exitState() {
            this.config.normal = this.docElement.getBoundingClientRect();
        },
    },

    maximised: {
        viewState: 'maximised',
        /**
         * Make widget full window.
         */
        enterState() {
            /*
            this.docElement.classList.remove('hidden');
            this.docElement.querySelector('.widget-content').classList.remove('hidden');
            */
            this.docElement.style.left = `0`;
            this.docElement.style.top = `0`;
            this.docElement.style.width = `100%`;
            this.docElement.style.height = `100%`;
            this.docElement.style.zIndex = `10`;
            this.docElement.classList.add('maximise');
            this.showInputs();
            this.showOutputs();
        },
        existState() {
            this.docElement.classList.remove('maximise');
        },
        showInputs() {},
        showOutputs() {},
        exitState() {},
    },

    tabified: {
        viewState: 'tabified',
        /**
         * Create a new tab and make this widget content it's page content.
         */
        enterState() {
            const content = this.docElement.querySelector('.widget-content');
            const link = document.createElement('div');
            content.replaceWith(link);
            const tab = App.tabbar.newTab(this.title, content);
            link.addEventListener('click', () => App.tabbar.selectTab(tab));
            link.classList.add('widget-content-space');
            App.tabbar.selectTab(tab);
            this.showInputs();
            this.showOutputs();

        },
        existState() {
            this.docElement.classList.remove('maximise');
        },
        showInputs() {},
        showOutputs() {},
        exitState() {},

    },

    shaded: {
        viewState: 'shaded',
        enterState() {
            const content = this.docElement.querySelector('.widget-content');
            content.classList.add('hidden');
            this.docElement.style.height = 'unset';
            if (this.config.shaded) {
                this.docElement.style.left = `${this.config.shaded.x}px`;
                this.docElement.style.top = `${this.config.shaded.y}px`;
                this.docElement.style.width = `${this.config.shaded.width}px`;
                this.docElement.style.height = `${this.config.shaded.height}px`;
            }
        },
        exitState() {
            const content = this.docElement.querySelector('.widget-content');
            content.classList.remove('hidden');
            this.config.shaded = this.docElement.getBoundingClientRect();
        },

    },

    iconified: {
        viewState: 'iconified',
        enterState() {
            const createIcon = () => {
                const node = document.createElement('div');
                node.classList.add('icon');
                const image = new Image();
                image.src = App.getIconPath(this.iconName);
                node.appendChild(image);
                node.appendChild(document.createElement('br'));
                node.appendChild(document.createTextNode(this.title));
                node.addEventListener('dblclick', (event) => this.setState('normal'));
                return node;
            }
            this.icon = this.icon || createIcon();
            this.docElement.parentElement.appendChild(this.icon);
            if (this.config.iconified) {
                this.icon.style.left = `${this.config.iconified.x}px`;
                this.icon.style.top = `${this.config.iconified.y}px`;
                this.icon.style.width = `${this.config.iconified.width}px`;
                this.icon.style.height = `${this.config.iconified.height}px`;
            } else {
                this.icon.style.left = `${this.config.normal.x}px`;
                this.icon.style.top = `${this.config.normal.y}px`;
                this.icon.style.width = `64px`;
                this.icon.style.height = `64px`;
            }
            this.docElement.classList.add('hidden');
        },
        exitState() {
            this.config.iconified = this.icon.getBoundingClientRect();
            this.docElement.classList.remove('hidden');
            this.icon.parentElement.removeChild(this.icon);
        },
    },
};

/**
 * Prototype for all widgets.
 * 
 * widgets can be in following state:
 * normal: moveable, resizable window showing inputs and outputs
 * maximised: full size window covering all others
 * shaded: moveable titlebar only
 * iconified: moveable icon only
 */
class Widget {
    constructor(title, options = {}) {
        this.uuid = options.uuid || UUID.create();
        this.iconName = 'applications';
        this.initialState = options;
        this.config = {};
        this.inputs = [];
        this.outputs = [];
        const template = document.querySelector('#widget-template');
        this.docElement = template.content.firstElementChild.cloneNode(true);
        this.box = this.docElement.querySelector('.widget-box');
        (options.container || document.body).appendChild(this.docElement);

        this.titleNode = this.docElement.querySelector('.widget-title');
        this.titleNode.innerHTML = `<span style="flex-grow:1">${title}</span>`;
        this.title = title;
        const action = (node) => this.title = node.innerHTML;
        const cancel = (node) => node.innerHTML = `<span style="flex-grow:1">${this.title}</span>`;
        doubleClickEdit(this.titleNode.firstElementChild, action, cancel);

        this.docElement.dataset.uuid = UUID.create();

        if (options.position) {
            this.docElement.style.left = `${options.position.x}px`;
            this.docElement.style.top = `${options.position.y}px`;
        }
        if (options.size) {
            this.docElement.style.width = `${options.size.width}`;
            this.docElement.style.height = `${options.size.height}`;
        }
        this.makeMoveable(this.docElement, this.titleNode);
        this.makeResizable(this.docElement);

        this.docElement.addEventListener('mouseover', (event) => {
            for (const input of this.docElement.querySelectorAll('.widget-input')) {
                input.classList.add('show');
            }
            for (const output of this.docElement.querySelectorAll('.widget-output')) {
                output.classList.add('show');
            }
        });

        this.docElement.addEventListener('mouseout', (event) => {
            for (const input of this.docElement.querySelectorAll('.widget-input')) {
                input.classList.remove('show');
            }
            for (const output of this.docElement.querySelectorAll('.widget-output')) {
                output.classList.remove('show');
            }
        });
        Object.assign(this, WidgetStates.normal);
    }
    close() {
        this.outputs.forEach((output) => {
            for (const connection of output.connections) {
                connection.source = undefined;
            }
            output.connections.clear();
        });
        this.inputs.filter((input) => input.source).forEach((input) => {
            input.source.connections.delete(input);
            input.source = undefined;
        });

        App.workspace.removeWidget(this);
    }
    get state() {
        const box = this.docElement.getBoundingClientRect();
        return {
            initial: this.initialState,
            position: { x: box.x, y: box.y },
            size: { width: box.width, height: box.height },
        };
    }
    get(name) {
        const output = this.outputs.find((output) => output.name === name);
        if (output) {
            return output.get() || output.value;
        }
    }
    update() {
        return () => {};
    }
    setState(newState) {
        if (this.viewState === newState) {
            newState = 'normal';
        }
        const state = WidgetStates[newState];
        if (state) {
            this.lastState = this.viewState;
            this.exitState();
            Object.assign(this, state);
            this.enterState();
        }
    }
    addInput(name, update) {
        update = update || this.update();
        const input = {
            name,
            update,
            owner: this,
            get id() { return this.owner.inputs.indexOf(this); }
        }
        this.inputs.push(input);
        this.showInputs();
        return input;
    }
    showInputs() {
        for (const node of this.box.querySelectorAll('.widget-input')) {
            this.box.removeChild(node);
        }

        this.inputs.forEach((input, index) => {
            const processDrop = (data) => {
                const sourceId = data['text/uuid'];
                const name = data['text/name'];
                const widget = App.workspace.index[sourceId];
                if (widget) {
                    App.workspace.connect({ widget, output: name }, { widget: this, input: input.name });
                } else {
                    this.inputs[index].value = data['text/value'];
                }
            };
            const node = document.createElement('div');
            node.tabIndex = 1;
            this.box.appendChild(node);
            node.classList.add('widget-input');
            node.style.top = `${5 + index * 30}px`;
            node.draggable = true;
            node.dataset.dropTarget = 'true';

            const label = document.createElement('div');
            node.appendChild(label);
            label.innerHTML = input.name;
            label.classList.add('widget-input-label');

            if (this.variableInputs) {
                const action = () => input.name = label.innerText;
                const cancel = () => label.innerHTML = input.name;
                doubleClickEdit(label, action, cancel);
            }
            input.port = document.createElement('div');
            node.appendChild(input.port);
            input.port.classList.add('input-port');

            node.addEventListener('dragover', (event) => event.preventDefault());
            node.addEventListener('drop', (event) => {
                event.preventDefault();
                processDrop({
                    'text/uuid': event.dataTransfer.getData('text/uuid'),
                    'text/name': event.dataTransfer.getData('text/name'),
                    'text/value': event.dataTransfer.getData('text/value'),
                });
            });
            node.addEventListener('touchdragover', (event) => {
                if (event.data['text/type'] === 'output') {}
            });
            node.addEventListener('touchdrop', (event) => {
                if (event.detail['text/type'] === 'output') {
                    processDrop(event.detail);
                }
            });
        });
        if (this.variableInputs) {
            const node = document.createElement('div');
            node.classList.add('widget-input');
            this.box.appendChild(node);
            node.dataset.dropTarget = 'true';
            node.style.top = `${5 + this.inputs.length * 30}px`;
            node.addEventListener('click', (event) => {
                let index = 1;
                while (this.inputs.find((input) => input.name === `input_${index}`)) {
                    index += 1;
                }
                this.addInput(`input_${index}`);
                this.showInputs();
            });
            node.addEventListener('dragover', (event) => event.preventDefault());
            node.addEventListener('drop', (event) => {
                event.preventDefault();
                const sourceId = event.dataTransfer.getData('text/uuid');
                const name = event.dataTransfer.getData('text/name');
                const widget = App.workspace.index[sourceId];
                if (widget) {
                    this.addInput(name);
                    App.workspace.connect({ widget, output: name }, { widget: this, input: name });
                } else {
                    this.inputs.push({
                        name: event.dataTransfer.getData('text/name'),
                        value: event.dataTransfer.getData('text/value'),
                    });
                }
                this.showInputs();
            });
            node.addEventListener('touchdrop', (event) => {
                if (event.detail['text/type'] === 'output') {
                    const sourceId = event.detail['text/uuid'];
                    const name = event.detail['text/name'];
                    const widget = App.workspace.index[sourceId];
                    if (widget) {
                        this.addInput(name);
                        App.workspace.connect({ widget, output: name }, { widget: this, input: name });
                    } else {
                        this.inputs.push({
                            name,
                            value: event.detail['text/value'],
                        });
                    }
                    this.showInputs();
                }
            });

            const label = document.createElement('div');
            node.appendChild(label);
            label.innerHTML = '+';
            label.classList.add('widget-input-label');

        }
    }
    addOutput(name, get) {
        const output = {
            name,
            connections: new Set(),
            get() { return get ? get() : this.value; },
            set(value) {
                this.value = value;
                [...this.connections].forEach((connection) =>
                    connection.update(value));
            },
            owner: this,
            get id() { return this.owner.outputs.indexOf(this); }
        }
        this.outputs.push(output);
        this.showOutputs();
        return output;
    }
    removeOutput(output) {
        while (this.outputs.includes(output)) {
            const pos = this.outputs.indexOf(output);
            this.outputs.splice(pos, 1);
        }
        this.showOutputs();
    }
    showOutputs() {
        for (const node of this.box.querySelectorAll('.widget-output')) {
            this.box.removeChild(node);
        }

        const outputs = [...this.outputs];
        outputs.reverse();
        outputs.forEach((output, index) => {
            const node = document.createElement('div');
            node.classList.add('input-output', 'widget-output');
            this.box.appendChild(node);
            node.style.bottom = `${5 + index * 30}px`;

            const label = document.createElement('div');
            node.appendChild(label);
            label.innerHTML = output.name;
            label.classList.add('widget-output-label');

            output.port = document.createElement('div');
            node.appendChild(output.port);
            output.port.classList.add('output-port');

            node.draggable = true;
            node.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData('text/uuid', this.uuid);
                event.dataTransfer.setData('text/value', output.get());
                event.dataTransfer.setData('text/name', output.name);
                for (const input of document.querySelectorAll('.widget-input')) {
                    input.classList.add('show');
                }
            });
            node.addEventListener('mousedown', (event) => event.cancelBubble = true);
            const dragstart = (event, data) => {
                data['text/type'] = 'output';
                data['text/uuid'] = this.uuid;
                data['text/value'] = output.get();
                data['text/name'] = output.name;
                for (const input of document.querySelectorAll('.widget-input')) {
                    input.classList.add('show');
                }
            };
            makeDraggable(node, dragstart);
        });
    }
    addButton(html, action) {
        const button = document.createElement('button');
        this.titleNode.appendChild(button);
        button.innerHTML = html;
        //button.style.float = 'right';
        button.addEventListener('click', (event) => action(event));
        button.addEventListener('mousedown', (event) => event.stopPropagation());
    }
    addButtons(buttons = []) {
        buttons.forEach((button) => this.addButton(...button));
        this.addButton('<img class="window-control" src="icons/amiga/iconify.png">', () => this.setState('iconified'));
        this.addButton('<img class="window-control" src="icons/amiga/window-shaded.png">', () => this.setState('shaded'));
        this.addButton('<img class="window-control" src="icons/buuf3.34/16x16/window-expand.png">', () => this.setState('maximised'));
        this.addButton('<img class="window-control" src="icons/buuf3.34/16x16/window-expand.png">', () => this.setState('tabified'));
        this.addButton('<img class="window-control" src="icons/amiga/window.png">', () => this.setState('normal'));
        this.addButton('<img class="window-control" src="icons/amiga/actions/16/gtk-quit.svg">', () => this.close());
    }
    makeMoveable(target, handle) {
        const start = {};
        let snapPoints = [];

        const snap = (value, reference, current) => {
            if (Math.abs(value - reference) <= current) {
                return [reference, Math.abs(value - reference), true]
            }
            return [value, current, false];
        }

        const moved = (event, delta, offset) => {
            let x = start.target.left + delta.x;
            let y = start.target.top + delta.y;
            if (event.ctrlKey) {
                [x, offset.x] = snap(x, start.target.x, offset.x);
                [x, offset.x] = snap(x, start.target.x + start.target.width, offset.x);
                [x, offset.x] = snap(x, start.target.x - start.target.width, offset.x);
                [y, offset.y] = snap(y, start.target.y, offset.y);
                [y, offset.y] = snap(y, start.target.y + start.target.height, offset.y);
                [y, offset.y] = snap(y, start.target.y + -start.target.height, offset.y);
            }
            for (const snapPoint of snapPoints) {
                const box = snapPoint.box;
                [x, offset.x] = snap(x, box.x, offset.x);
                [x, offset.x] = snap(x, box.x + box.width, offset.x);
                [x, offset.x] = snap(x, box.x - start.target.width, offset.x);
                [y, offset.y] = snap(y, box.y, offset.y);
                [y, offset.y] = snap(y, box.y + box.height, offset.y);
                [y, offset.y] = snap(y, box.y + -start.target.height, offset.y);
            }

            target.style.left = `${x}px`;
            target.style.top = `${y}px`;
            delta.x = x - start.target.left;
            delta.y = y - start.target.top;
            setOverlayText(`${x.toFixed(0)}, ${y.toFixed(0)}`);
            return { x: x - start.target.left, y: y - start.target.top };
        }

        handle.style.cursor = 'grab';
        let action;
        handle.addEventListener('mousedown', (event) => {
            if (event.button === 0) {
                handle.style.cursor = 'grabbing';
                document.body.style.cursor = 'grabbing';
                App.workspace.select(this);

                const others = event.shiftKey ? [] : App.workspace.selection.filter((other) => other != this);
                others.forEach((other) => other.box = other.docElement.getBoundingClientRect());

                start.mouse = { x: event.clientX, y: event.clientY };
                start.target = target.getBoundingClientRect();
                snapPoints = getSnapPoints(others);
                let first = true;
                action = (event) => {
                    if (first) {
                        const last = target.parentElement.lastChild;
                        last.replaceWith(target);
                        target.parentElement.insertBefore(last, target);
                        event.preventDefault();
                        first = false;
                    }
                    const delta = {
                        x: event.clientX - start.mouse.x,
                        y: event.clientY - start.mouse.y,
                    }
                    const offset = { x: snapSize.x, y: snapSize.y };
                    moved(event, delta, offset);
                    if (!event.shiftKey) {
                        others.forEach((widget) => {
                            widget.docElement.style.left = `${widget.box.left + delta.x}px`;
                            widget.docElement.style.top = `${widget.box.top + delta.y}px`;
                        });
                    }
                    App.workspace.redrawConnections();
                };
                document.body.addEventListener('mousemove', action);
            } else {
                handle.style.cursor = 'grab';
                document.body.style.cursor = 'auto';
                document.body.removeEventListener('mousemove', action);
            }
            event.cancelBubble = true;
            return true;
        });

        document.body.addEventListener('mouseup', (event) => {
            handle.style.cursor = 'grab';
            document.body.style.cursor = 'auto';

            document.body.removeEventListener('mousemove', action);
            clearOverlayText();
        });
        let delta;

        handle.addEventListener('touchstart', (event) => {
            event.preventDefault();

            handle.style.cursor = 'grabbing';
            document.body.style.cursor = 'grabbing';
            App.workspace.select(this);

            const others = event.shiftKey ? [] : App.workspace.selection.filter((other) => other != this);
            others.forEach((other) => other.box = other.docElement.getBoundingClientRect());
            start.touch = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
            start.target = target.getBoundingClientRect();
            snapPoints = getSnapPoints(others);
            action = (event) => {
                event.preventDefault();
                delta = {
                    x: event.touches[0].clientX - start.touch.x,
                    y: event.touches[0].clientY - start.touch.y,
                }
                const offset = { x: snapSize.x, y: snapSize.y };
                moved(event, delta, offset);

                others.forEach((widget) => {
                    widget.docElement.style.left = `${widget.box.left + delta.x}px`;
                    widget.docElement.style.top = `${widget.box.top + delta.y}px`;
                });
                App.workspace.redrawConnections();
            };
            document.body.addEventListener('touchmove', action);
            const last = target.parentElement.lastChild;
            last.replaceWith(target);
            target.parentElement.insertBefore(last, target);
        });

        document.body.addEventListener('touchend', (event) => {
            handle.style.cursor = 'grab';
            document.body.style.cursor = 'auto';
            if (Math.hypot(delta.x, delta.y) < 5) {
                const newEvent = new MouseEvent('click', event);
                event.target.dispatchEvent(newEvent);
                event.preventDefault();
            }
            document.body.removeEventListener('touchmove', action);
            clearOverlayText();
        });
    }

    makeResizable(target, handle) {
        handle = handle || document.body;
        const start = {};
        let snapPoints = [];

        const snap = (value, reference, current) => {
            if (Math.abs(value - reference) < current) {
                return [reference, Math.abs(value - reference), true]
            }
            return [value, current, false];
        }

        const resizeLeft = (event) => {
            let offset = snapSize.x;
            let position = start.target.x + event.clientX - start.mouse.x;
            if (!event.shiftKey) {
                let width;
                for (const snapPoint of snapPoints) {
                    const box = snapPoint.box;
                    [position, offset] = snap(position, box.x, offset);
                    [position, offset] = snap(position, box.x + box.width, offset);

                    width = start.target.width - position + start.target.x;
                    [width, offset] = snap(width, box.width, offset);
                    position = start.target.x - width + start.target.width;
                }
            }
            target.style.left = `${position}px`;
            target.style.width = `${start.target.width - position + start.target.x}px`;
        };

        const resizeRight = (event) => {
            let offset = snapSize.x;
            let position = start.target.x + start.target.width + event.clientX - start.mouse.x;
            if (!event.shiftKey) {
                let width;
                for (const snapPoint of snapPoints) {
                    const box = snapPoint.box;
                    [position, offset] = snap(position, box.x, offset);
                    [position, offset] = snap(position, box.x + box.width, offset);

                    width = position - start.target.x;
                    [width, offset] = snap(width, box.width, offset);
                    position = start.target.x + width;
                }
            }
            target.style.width = `${position - start.target.x}px`;
        };

        const resizeTop = (event) => {
            let offset = snapSize.y;
            let position = start.target.y + event.clientY - start.mouse.y;
            if (!event.shiftKey) {
                let height;
                for (const snapPoint of snapPoints) {
                    const box = snapPoint.box;
                    [position, offset] = snap(position, box.y, offset);
                    [position, offset] = snap(position, box.y + box.height, offset);

                    height = start.target.height - position + start.target.y;
                    [height, offset] = snap(height, box.height, offset);
                    position = start.target.y - height + start.target.height;
                }
            }
            target.style.top = `${position}px`;
            target.style.height = `${start.target.height - position + start.target.y}px`;
        };

        const resizeBottom = (event) => {
            let offset = snapSize.y;
            let position = start.target.y + start.target.height + event.clientY - start.mouse.y;
            if (!event.shiftKey) {
                let height;
                for (const snapPoint of snapPoints) {
                    const box = snapPoint.box;
                    [position, offset] = snap(position, box.y, offset);
                    [position, offset] = snap(position, box.y + box.height, offset);

                    height = position - start.target.y;
                    [height, offset] = snap(height, box.height, offset);
                    position = start.target.y + height;
                }
            }
            target.style.height = `${position - start.target.y}px`;
        };

        const topLeftResize = target.querySelector('.resize-top-left');
        const topResize = target.querySelector('.resize-top');
        const topRightResize = target.querySelector('.resize-top-right');
        const rightResize = target.querySelector('.resize-right');
        const bottomRightResize = target.querySelector('.resize-bottom-right');
        const bottomResize = target.querySelector('.resize-bottom');
        const bottomLeftResize = target.querySelector('.resize-bottom-left');
        const leftResize = target.querySelector('.resize-left');

        const startResize = (event) => {
            start.target = target.getBoundingClientRect();
            start.mouse = { x: event.clientX, y: event.clientY };
            snapPoints = getSnapPoints([target]);
            App.workspace.updateConnections();
        }

        const startTouchResize = (event) => {
            event.preventDefault();
            start.target = target.getBoundingClientRect();
            start.mouse = { x: event.touches[0].clientX, y: event.touches[0].clientY };
            snapPoints = getSnapPoints([target]);
        }

        const redispatch = (event) => {
            console.log(event.target);
            const under = document.elementsFromPoint(event.clientX, event.clientY)
                .filter((element) => element.classList.contains('resize'));
            if (event.target === under[0]) {
                under.filter((element) => element !== event.target)
                    .forEach((element) => {
                        const newEvent = new MouseEvent(event.type, event);
                        element.dispatchEvent(newEvent);
                    });
            }
        }

        function mouseMove(event) {
            const position = {
                clientX: event.clientX,
                clientY: event.clientY,
                shiftKey: event.shiftKey,
            };
            actions.forEach((action) => action(position));
            event.preventDefault();
            const box = target.getBoundingClientRect();
            setOverlayText(`${box.width} &times; ${box.height}`);
            App.workspace.redrawConnections();
        }

        topLeftResize.addEventListener('mousedown', (event) => {
            startResize(event);
            if (!event.shiftKey && topLeftResize === event.target) {
                redispatch(event);
            }
            actions = [resizeLeft, resizeTop];
            document.body.addEventListener('mousemove', mouseMove);
        });

        topResize.addEventListener('mousedown', (event) => {
            startResize(event);
            if (!event.shiftKey && topResize === event.target) {
                redispatch(event);
            }
            actions = [resizeTop];
            document.body.addEventListener('mousemove', mouseMove);
        });

        topRightResize.addEventListener('mousedown', (event) => {
            startResize(event);
            if (!event.shiftKey && topRightResize === event.target) {
                redispatch(event);
            }
            actions = [resizeRight, resizeTop];
            document.body.addEventListener('mousemove', mouseMove);
        });

        rightResize.addEventListener('mousedown', (event) => {
            startResize(event);
            if (!event.shiftKey && rightResize === event.target) {
                redispatch(event);
            }
            actions = [resizeRight];
            document.body.addEventListener('mousemove', mouseMove);
        });

        bottomRightResize.addEventListener('mousedown', (event) => {
            startResize(event);
            if (!event.shiftKey && bottomRightResize === event.target) {
                redispatch(event);
            }
            actions = [resizeRight, resizeBottom];
            document.body.addEventListener('mousemove', mouseMove);
        });

        bottomResize.addEventListener('mousedown', (event) => {
            startResize(event);
            if (!event.shiftKey && bottomResize === event.target) {
                redispatch(event);
            }
            actions = [resizeBottom];
            document.body.addEventListener('mousemove', mouseMove);
        });

        bottomLeftResize.addEventListener('mousedown', (event) => {
            startResize(event);
            if (!event.shiftKey && bottomLeftResize === event.target) {
                redispatch(event);
            }
            actions = [resizeLeft, resizeBottom];
            document.body.addEventListener('mousemove', mouseMove);
        });

        leftResize.addEventListener('mousedown', (event) => {
            startResize(event);
            if (!event.shiftKey && leftResize === event.target) {
                redispatch(event);
            }
            actions = [resizeLeft];
            document.body.addEventListener('mousemove', mouseMove);
        });

        document.body.addEventListener('mouseup', (event) => {
            document.body.removeEventListener('mousemove', mouseMove);
            target.dispatchEvent(new Event('resized'));
            clearOverlayText();
            if (this.onResize) {
                this.onResize();
            }
        });

        let actions = [];

        function touchMove(event) {
            const position = {
                clientX: event.touches[0].clientX,
                clientY: event.touches[0].clientY,
            };
            actions.forEach((action) => action(position));
            App.workspace.redrawConnections();
            event.preventDefault();
        }

        topLeftResize.addEventListener('touchstart', (event) => {
            startTouchResize(event);
            actions = [resizeLeft, resizeTop];
            document.body.addEventListener('touchmove', touchMove);
        });

        topResize.addEventListener('touchstart', (event) => {
            startTouchResize(event);
            actions = [resizeTop];
            document.body.addEventListener('touchmove', touchMove);
        });

        topRightResize.addEventListener('touchstart', (event) => {
            startTouchResize(event);
            actions = [resizeRight, resizeTop];
            document.body.addEventListener('touchmove', touchMove);
        });

        rightResize.addEventListener('touchstart', (event) => {
            startTouchResize(event);
            actions = [resizeRight];
            document.body.addEventListener('touchmove', touchMove);
        });

        bottomRightResize.addEventListener('touchstart', (event) => {
            startTouchResize(event);
            actions = [resizeRight, resizeBottom];
            document.body.addEventListener('touchmove', touchMove);
        });

        bottomResize.addEventListener('touchstart', (event) => {
            startTouchResize(event);
            actions = [resizeBottom];
            document.body.addEventListener('touchmove', touchMove);
        });

        bottomLeftResize.addEventListener('touchstart', (event) => {
            startTouchResize(event);
            actions = [resizeLeft, resizeBottom];
            document.body.addEventListener('touchmove', touchMove);
        });

        leftResize.addEventListener('touchstart', (event) => {
            startTouchResize(event);
            actions = [resizeLeft];
            document.body.addEventListener('touchmove', touchMove);
        });

        document.body.addEventListener('touchend', (event) => {
            document.body.removeEventListener('touchmove', touchMove);
            target.dispatchEvent(new Event('resized'));
            if (this.onResize) {
                this.onResize();
            }
        });
    }
    save() {
        const state = this.state;
        save(`saved/widgets/${this.uuid}.json`, JSON.stringify(this.state));
    }
}

class ExcelParser extends Widget {
    static type = 'Excel Parser';
    constructor(options = {}) {
        super('Excel Parser', options);
        const content = this.docElement.querySelector('.widget-content');
        content.addEventListener('dragover', (event) => event.preventDefault());
        content.addEventListener('drop', (event) => {

            // Prevent default behavior (Prevent file from being opened)
            event.preventDefault();

            if (event.dataTransfer.items) {
                // Use DataTransferItemList interface to access the file(s)
                for (var i = 0; i < event.dataTransfer.items.length; i++) {
                    // If dropped items aren't files, reject them
                    if (event.dataTransfer.items[i].kind === 'file') {
                        var file = event.dataTransfer.items[i].getAsFile();
                        let workbook = Workbook(file);
                        showSheetList(workbook, content);
                    }
                }
            } else {
                // Use DataTransfer interface to access the file(s)
                for (var i = 0; i < event.dataTransfer.files.length; i++) {
                    let workbook = Workbook(event.dataTransfer.files[i]);
                    showSheetList(workbook, content);
                    //loadExcelFiles(event.dataTransfer.files[i], content);
                }
            }
        });
        this.addButtons();
    }
    get state() {
        return {
            type: ExcelParser.type,
            common: super.state,
        }
    }
}


class ZipExplorer extends Widget {
    static type = 'Zip Explorer';
    constructor(options = {}) {
        super('Zip Explorer', options);
        const content = this.docElement.querySelector('.widget-content');
        content.addEventListener('dragover', (event) => event.preventDefault());
        content.addEventListener('drop', (event) => {

            // Prevent default behavior (Prevent file from being opened)
            event.preventDefault();

            if (event.dataTransfer.items) {
                // Use DataTransferItemList interface to access the file(s)
                for (var i = 0; i < event.dataTransfer.items.length; i++) {
                    // If dropped items aren't files, reject them
                    if (event.dataTransfer.items[i].kind === 'file') {
                        var file = event.dataTransfer.items[i].getAsFile();
                        loadFiles(file, content);
                        console.log('... file[' + i + '].name = ' + file.name);
                    }
                }
            } else {
                // Use DataTransfer interface to access the file(s)
                for (var i = 0; i < event.dataTransfer.files.length; i++) {
                    loadFiles(event.dataTransfer.files[i], content);
                    console.log('... file[' + i + '].name = ' + event.dataTransfer.files[i].name);
                }
            }
        });
        this.addButtons();
    }
    get state() {
        return {
            type: ZipExplorer.type,
            common: super.state,
        };
    }
}

class TextFileView extends Widget {
    static type = 'Text File View';
    constructor(options = {}) {
        super(options.file, options);
        this.file = options.file;
        this.content = this.docElement.querySelector('.widget-content');
        if (options.file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.content.innerText = event.target.result;
                this.outputs[0].set(event.target.result);
            };
            reader.readAsText(file);
        } else {
            this.content.innerText = options.content || '';
        }
        this.addOutput('text');
        this.addButtons();
    }
    get state() {
        return {
            type: TextFileView.type,
            common: super.state,
            filename: file,
            content: this.content.innerText,
        };
    }
}

class HtmlWindow extends Widget {
    static type = 'HTML';
    constructor(options = {}) {
        super(HtmlWindow.type, options);
        this.content = this.docElement.querySelector('.widget-content');
        this.content.classList.add('output');

        this.addInput('Input', (value) => {
            this.content.innerHTML = value;
        });
        this.addButtons([
            ['&#x239A', () => content.innerHTML = ''],
            ['&#x1f4be;', () => this.download('output.txt', content.innerText)],
        ]);
    }
    download(filename, data) {
        const blob = new Blob([data], { type: 'text/plain' });
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        } else {
            const elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    }
    get state() {
        return {
            type: HtmlWindow.type,
            common: super.state,
        };
    }
}

class FrameTriggerWindow extends Widget {
    static type = 'Frame Trigger';
    constructor(options = {}) {
        Object.assign(options, { size: { width: 260, height: 60 } });
        super(FrameTriggerWindow.type, options);
        this.content = this.docElement.querySelector('.widget-content');
        this.content.classList.add('output');
        this.content.style.textAlign = 'Center';

        this.running = false;
        this.frame = this.addOutput('Frame');
        this.addButtons([
            ['&#x25B6', () => this.toggleRun()],
        ]);
    }
    toggleRun() {
        const run = (time) => {
            this.frame.set(time);
            if (this.running) {
                window.requestAnimationFrame(run);
            }
        }
        this.running = !this.running;
        if (this.running) {
            this.content.innerHTML = 'Running';
            window.requestAnimationFrame(run);
        } else {
            this.content.innerHTML = 'Stopped';
        }
    }
    get state() {
        return {
            type: FrameTriggerWindow.type,
            common: super.state,
        };
    }
    close() {
        super.close();
        this.running = false;
    }
}


class CanvasWindow extends Widget {
    static type = '2D Canvas';
    constructor(options = {}) {
        super(CanvasWindow.type, options);
        this.content = this.docElement.querySelector('.widget-content');
        this.content.classList.add('canvas');
        this.canvas = document.createElement('canvas');
        this.content.appendChild(this.canvas);

        this.running = false;
        this.context = this.addOutput('Context');
        this.context.set(this.canvas.getContext('2d'));
        this.addButtons([
            ['<img class="window-control" src="icons/amiga/scale.png">', () => {
                this.scaled = !this.scaled;
                this.onResize();
            }]
        ]);
        this.onResize();
    }
    onResize() {
        if (this.scaled) {
            this.canvas.width = 1024;
            this.canvas.height = 1024;
        } else {
            const box = this.content.getBoundingClientRect();
            this.canvas.width = box.width;
            this.canvas.height = box.height;
        }
    }
    get state() {
        return {
            type: CanvasWindow.type,
            common: super.state,
        };
    }
}

class WebGLWindow extends Widget {
    static type = 'WebGL Canvas';
    constructor(options = {}) {
        super(WebGLWindow.type, options);
        this.content = this.docElement.querySelector('.widget-content');
        this.content.classList.add('canvas');
        this.canvas = document.createElement('canvas');
        this.content.appendChild(this.canvas);

        this.running = false;
        this.context = this.addOutput('Context');
        this.context.set(this.canvas.getContext('webGL'));
        this.addButtons();
    }
    get state() {
        return {
            type: WebGLWindow.type,
            common: super.state,
        };
    }
}


class LogWindow extends Widget {
    static type = 'Log';
    constructor(options = {}) {
        super(LogWindow.type, options);
        this.items = [];
        this.content = this.docElement.querySelector('.widget-content');
        this.content.classList.add('output');

        this.addInput('Input', (value) => {
            const container = document.createElement('div');
            this.content.appendChild(container);
            container.innerHTML = value;
        });
        // Ignore input clear the window
        this.addInput('Clear', (value) => {
            content.innerHTML = '';
            this.items.length = 0;
        });

        this.addButtons([
            ['&#x239A', () => content.innerHTML = ''],
            ['&#x1f4be;', () => this.download('output.txt', content.innerText)]
        ]);
    }
    newItem(content) {
        const item = {
            timestamp: new Date(),
            content,
        }
        const node = document.createElement('div');
        this.content.appendChild(node);
        node.classList.add('log-item');

        const time = document.createElement('span');
        node.appendChild(time);
        time.innerHtml = item.timestamp.toLocaleDate();
        time.classList.add('timestamp');

        const contentNode = document.createElement('span');
        node.appendChild(contentNode);
        contentNode.innerHtml = content;
        contentNode.classList.add('content');

        const remove = document.createElement('span');
        node.appendChild(remove);
        remove.innerHtml = item.timestamp.toLocaleDate();
        contentNode.classList.add('remove');
        remove.addEventListener('click', (event) => {
            this.content.removeChild(node);
        });

        this.items.push(item);
    }
    download(filename, data) {
        const blob = new Blob([data], { type: 'text/plain' });
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        } else {
            const elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    }
    get state() {
        return {
            type: LogWindow.type,
            common: super.state,
            content: this.items,
        };
    }
}

class CommandWindow extends Widget {
    static type = 'Command Window';
    constructor(options = {}) {
        super(CommandWindow.type, options);
        this.commands = [];
        this.content = this.docElement.querySelector('.widget-content');
        this.content.classList.add('output');

        this.addInput('Input', (value) => {});
        // Ignore input clear the window
        this.addInput('Clear', (value) => {});

        this.addButtons([
            ['&#x239A', () => content.innerHTML = ''],
            ['&#x1f4be;', () => this.download('output.txt', content.innerText)]
        ]);
        this.current = document.createElement('input');
        this.content.appendChild(this.current);
        this.current.classList.add('command-item');
        this.current.focus();
        this.current.addEventListener('keyup', (event) => this.handleKey(event));
        this.recallIndex = 0;
        this.recall = [];
    }
    addItem(content) {
        const item = {
            timestamp: new Date(),
            content,
        };
        const node = document.createElement('div');
        this.content.insertBefore(node, this.current);
        node.innerHTML = content;
        node.classList.add('command-history');
        const commandNumber = document.createElement('div');
        node.appendChild(commandNumber);
        commandNumber.classList.add('command-number');
        commandNumber.innerHTML = this.commands.length;
        this.commands.push(item);
    }
    handleKey(event) {
        if (event.key === 'Enter') {
            this.processCommand();
        }
        if (event.key === 'ArrowUp') {
            if (this.recallIndex) {
                const index = this.commands.length - this.recallIndex;
                this.recall.unshift(this.commands[index]);
                this.recallIndex += 1;
            }
            if (this.recallIndex === this.commands.length - 1) {
                this.recallIndex = 0;
                this.recall = [];
                this.current.value = this.commands[this.recallIndex].content;
            } else {
                const index = this.commands.length - this.recallIndex;
                this.current.value = this.commands[index].content;
            }
        }
        if (event.key === 'ArrowDown') {
            if (this.recallIndex < this.commands.length - 1) {
                this.recallIndex += 1;
                this.current.value = this.recall.shift().content;
            } else {
                this.current.value = '';
            }
        }

    }
    processCommand() {
        if (this.recallIndex < this.commands.length) {
            this.recall.shift();
        }
        this.addItem(this.current.value);
        this.recallIndex = this.commands.length;
        if (this.recall.length > 0) {
            this.current.value = this.recall.shift().content;
        } else {
            this.current.value = '';
        }
    }
    download(filename, data) {
        const blob = new Blob([data], { type: 'text/plain' });
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        } else {
            const elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    }
    get state() {
        return {
            type: CommandWindow.type,
            common: super.state,
            content: this.commands,
        };
    }
}

class CodeWindow extends Widget {
    static type = 'Code Window';
    variableInputs = true;
    triggers = { inputChange: false };
    constructor(options = {}) {
        super(CodeWindow.type, options);
        const content = this.docElement.querySelector('.widget-content');
        content.classList.add('code');

        this.editor = ace.edit(content);
        this.editor.session.setMode('ace/mode/javascript');
        this.editor.setAutoScrollEditorIntoView(true);
        this.docElement.addEventListener('resized', () => {
            this.editor.resize();
            this.editor.renderer.updateFull();
        });
        if (options.source) {
            this.editor.session.setValue(options.source);
        }
        this.changed = true;
        this.editor.session.on('change', function(delta) {
            // delta.start, delta.end, delta.lines, delta.action
            this.changed = true;
        });

        this.addButtons([
            ['&#x25B6', (event) => this.run(event)],
            ['&#x1f4be;', (event) => this.download('code.js', this.editor.getValue())],
        ]);

        this.docElement.tabIndex = 1;

        if (options.inputs) {
            options.inputs.forEach((input) => this.addInput(input));
        }
        this.showInputs();

        this.text = this.addOutput('Text', () => this.editor.session.getValue());
        this.function = this.addOutput('Function', () => this.function);
        this.result = this.addOutput('Result');
    }
    update() {
        console.log('code update');
        return () => {
            if (this.triggers.inputChange) {
                this.run();
            }
        }
    }
    run(event) {
        document.body.style.cursor = 'wait';
        const text = this.editor.getValue();
        try {
            const values = this.inputs.map((input) => {
                if (input.source) {
                    return input.source.get();
                }
                return input.value;
            });
            this.text.set(text);
            if (this.changed) {
                const func = new Function(...this.inputs.map((input) => input.name), text);
                this.function.set(func);
            }
            this.result.set(this.function.value(...values));
        } catch (e) {
            console.log(e);
        }
        updateGlobals();
        document.body.style.cursor = 'auto';
    }
    download(filename, data) {
        const blob = new Blob([data], { type: 'text/plain' });
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        } else {
            const elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    }
    get state() {
        return {
            type: CodeWindow.type,
            common: super.state,
            source: this.editor.getValue(),
            inputs: this.inputs.map((input) => input.name),
        };
    }
}



class ControlWindow extends Widget {
    static type = 'Control Window';
    static inputTypes = [
        { name: 'Checkbox', get: (node) => node.checked, set: (node, value) => node.checked = value, },
        { name: 'Colour', type: 'color', },
        { name: 'Date', get: (node) => new Date(node.value), set: (node, value) => node.value = value.toISOString(), },
        { name: 'Datetime', type: 'datetime-local', get: (node) => Date.parse(node.value), set: (node, value) => node.value = value.toISOString() },
        { name: 'Email', },
        { name: 'File', },
        { name: 'Image', },
        { name: 'Month', },
        { name: 'Number', },
        { name: 'Password', },
        { name: 'Radio', },
        { name: 'Range', },
        { name: 'Search', },
        { name: 'Submit', },
        { name: 'Tel', },
        { name: 'Text', },
        { name: 'Time', },
        { name: 'URL', },
        { name: 'Week', },
    ];
    constructor(options = {}) {
        super(ControlWindow.type, options);
        const container = this.docElement.querySelector('.widget-content');
        this.content = document.createElement('div');
        container.appendChild(this.content);

        this.controls = new Set();
        (options.controls || []).forEach((state) => {
            const controlType = ControlWindow.inputTypes.find(
                (type) => type.type === state.type || type.name === state.name);
            const control = {
                name: controlType.name,
                type: controlType.type || controlType.name.toLocaleLowerCase(),
                get value() {
                    return controlType.get ? controlType.get(this.node) : this.node.value;
                },
                set value(value) {
                    controlType.set ? controlType.set(value) : this.node.value = value;
                },
            };
            this.addControl(control, state.value);

        });

        const controlSelector = document.createElement('select');
        container.appendChild(controlSelector);
        ControlWindow.inputTypes.forEach((inputType) => {
            const option = document.createElement('option');
            controlSelector.appendChild(option);
            option.innerHTML = inputType.name;
            option.value = inputType.name;
        });
        controlSelector.addEventListener('change', (event) => {
            const controlType = ControlWindow.inputTypes.find(
                (type) => type.name === controlSelector.value);
            const control = {
                name: controlType.name,
                type: controlType.type || controlType.name.toLocaleLowerCase(),
                get: controlType.get || ((node) => node.value),
                set: controlType.set || ((node, value) => node.value = value),
            };
            this.addControl(control);
        });

        this.addButtons();
        /*
        this.addButton('&#x25B6;', getData);
        this.addButton('&#x239A', (event) => content.innerHTML = '');
        this.addButton('&#x1f4be;', (event) => save('output.txt', content.innerText));
        */
    }
    addControl(control, value) {
        this.controls.add(control);
        const controlContainer = document.createElement('div');
        this.content.appendChild(controlContainer);

        const label = document.createElement('label');
        controlContainer.appendChild(label);
        label.innerText = `${control.name}: `;
        const input = document.createElement('input');
        input.type = control.type;
        controlContainer.appendChild(input);
        input.addEventListener('change', () => control.output.set(control.value));
        control.node = input;
        const remove = document.createElement('button');
        controlContainer.appendChild(remove);
        remove.innerHTML = '&times;';
        remove.addEventListener('click', (event) => {
            this.content.removeChild(controlContainer);
            this.removeControl(control);
        });
        control.output = this.addOutput(control.name, () => control.value);
        if (value !== undefined) {
            control.value = value;
        }
    }
    removeControl(control) {
        this.removeOutput(control.output);
        this.controls.delete(control);
    }
    get state() {
        return {
            type: ControlWindow.type,
            common: super.state,
            controls: [...this.controls].map((control) => ({
                name: control.name,
                type: control.type,
                value: control.value,
            })),
        };
    }
}

class DataWindow extends Widget {
    static type = 'Data Window';
    constructor(options = {}) {
        super(DataWindow.type, options);
        const content = this.docElement.querySelector('.widget-content');
        content.classList.add('data');

        const title = this.docElement.querySelector('.widget-title');
        title.firstElementChild.style.flexGrow = 0;

        const path = document.createElement('input');
        title.appendChild(path);
        path.size = 30;

        function getData(event) {
            localStorage.setItem('path', path.value);
            Ajax.get(path.value).then(text => {
                content.innerHTML = text;
            });
        }
        path.addEventListener('change', getData);
        path.value = localStorage.getItem('path') || '';
        path.placeholder = 'URL to retreive data.';
        path.style.flexGrow = 1;
        path.style.marginLeft = '0.5em';

        this.addButtons([
            ['&#x25B6;', getData],
            ['&#x239A', (event) => content.innerHTML = ''],
            ['&#x1f4be;', (event) => this.download('data.txt', content.innerText)],
        ]);
    }
    download(filename, data) {
        var blob = new Blob([data], { type: 'text/plain' });
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        } else {
            var elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    }
    get state() {
        return {
            type: DataWindow.type,
            common: super.state,
        };
    }
}

const WidgetTypes = [
    FrameTriggerWindow,
    LogWindow,
    CommandWindow,
    TextFileView,
    ControlWindow,
    CodeWindow,
    HtmlWindow,
    CanvasWindow,
    WebGLWindow,
    DataWindow,
    ZipExplorer,
    ExcelParser,
];

function newWidgetList() {
    const list = document.getElementById('widget-types');
    WidgetTypes.forEach((widgetType) => {
        const item = document.createElement('li');
        list.appendChild(item);
        item.innerHTML = widgetType.type;
        item.addEventListener('click', () => App.workspace.addWidget(widgetType));
    });
}

//newWidgetList();

class Workspace {
    constructor(name, state) {
        this.name = name;
        this.index = {};
        this.connections = new Set();
        this.selection = [];

        const template = document.querySelector('#workspace-template');
        this.docElement = template.content.firstElementChild.cloneNode(true);

        this.controls = new Controls(this.docElement.querySelector('.workspace-controls'), {
            save: () => this.save(),
            onTitleDisplayChange: (event) => {
                const widgetBorderRule = getCSSRule('.widget-border');
                const widgetTitleRule = getCSSRule('.widget-title');
                if (event.target.checked) {
                    widgetBorderRule.style.opacity = '100%';
                    widgetTitleRule.style.opacity = '100%';
                } else {
                    widgetBorderRule.style.opacity = 0;
                    widgetTitleRule.style.opacity = 0;
                }
            }
        });

        this.container = this.docElement.querySelector('.workspace-content');
        this.container.addEventListener('click',
            (event) => this.cursor = {
                x: event.clientX,
                y: event.clientY,
            });
        this.container.addEventListener('dblclick', (event) => {
            if (event.target === this.container) {
                const position = { x: event.clientX, y: event.clientY };
                this.addWidget(CommandWindow, { position });
            }
        });
        this.container.addEventListener('keypress', (event) => this.keypress(event));
        if (state) {
            this.loadState(state);
        }
        this.widgetTypeList();
    }
    widgetTypeList() {
        const list = this.docElement.querySelector('.widget-types');
        WidgetTypes.sort((a, b) => a.type.localeCompare(b.type));
        WidgetTypes.forEach((widgetType) => {
            const item = document.createElement('li');
            list.appendChild(item);
            item.innerHTML = widgetType.type;
            item.addEventListener('click', () => this.addWidget(widgetType));
        });
    }
    loadState(state) {
        const widgets = state.widgets.map((widget) => {
            return load(`saved/widgets/${widget.uuid}.json`).then((text) => {
                const options = JSON.parse(text);
                Object.assign(options, widget);
                const widgetType = WidgetTypes.find((type) => type.type === options.type);
                this.addWidget(widgetType, options);
            });
        });
        Promise.all(widgets).then(() => {
            state.connections.forEach((connection) => {
                const source = this.index[connection.from.widget];
                const destination = this.index[connection.to.widget];
                const output = source.outputs[connection.from.output];
                const input = destination.inputs[connection.to.input];
                output.connections.add(input);
                input.source = output;
            });
        });
    }
    keypress(event) {
        if (event.target === this.container) {
            if (event.key.length === 1) {
                this.addWidget(CommandWindow, { position: this.cursor });
            }
        }
    }
    addItem(list, widget) {
        const item = document.createElement('li');
        list.appendChild(item);
        item.classList.add(widget.uuid);
        item.innerHTML = widget.title;
        item.addEventListener('click',
            (event) => this.select(widget, event));
        item.addEventListener('dblclick', (event) => {
            const box = widget.docElement.parentElement.getBoundingClientRect();
            widget.docElement.style.top = `${box.y + 20}px`;
            widget.docElement.style.left = `${box.x + 20}px`;
            this.redrawConnections();
        });
    }
    show(parent) {
        parent.appendChild(this.container);
        const list = this.docElement.querySelector('.widget-list');
        list.innerHTML = '';
        this.all.forEach((widget) => this.addItem(list, widget));
        SVGOverlay.clear();
        this.connections.clear();
        this.updateConnections();
        this.drawConnections();
    }
    addWidget(widgetType, options = {}) {
        options.container = this.container;
        const widget = new widgetType(options);
        this.index[widget.uuid] = widget;
        const list = this.docElement.querySelector('.widget-list');
        this.addItem(list, widget);
    }
    removeWidget(widget) {
        this.index[widget.uuid] = undefined;
        widget.docElement.parentElement.removeChild(widget.docElement);
        for (const node of document.getElementsByClassName(widget.uuid)) {
            node.parentElement.removeChild(node);
        }
        this.connections.clear();
        SVGOverlay.clear();
        this.updateConnections();
    }
    get all() {
        return Object.values(this.index).filter((widget) => widget);
    }
    connect(source, destination) {
        const output = source.widget.outputs.find((output) => output.name === source.output);
        const input = destination.widget.inputs.find((input) => input.name === destination.input);
        if (input.source) {
            this.disconnect(input);
        }
        output.connections.add(input);
        input.source = output;
        this.connections.add(input);
        this.updateConnections();
        this.redrawConnections();
    }
    disconnect(input) {
        const output = input.source;
        output.connections.delete(input);
        input.source = undefined;
        this.connections.delete(input);
    }
    select(widget, options = {}) {
        this.selection.forEach((widget) => {
            widget.docElement.classList.remove('selected');
        });

        this.selection.length = 0;
        const selection = {
            'single': () => [widget],
            'connected': () => this.getConnected(widget),
            'network': () => this.getNetwork(widget),
            'adjacent': () => this.getAdjacent(widget),
        }[this.controls.selectionMode]();
        selection.forEach((widget) => {
            this.selection.push(widget);
            widget.docElement.classList.add('selected');
        });

        this.updateConnections();
    }
    updateConnections() {
        for (const connection of this.connections) {
            if (connection.curve) {
                SVGOverlay.remove(connection.curve);
            }
        }

        this.selection.forEach((widget) => {
            widget.inputs.forEach((input) => {
                if (input.source) {
                    this.connections.add(input);
                }
            });
            widget.outputs.forEach((output) => {
                output.connections.forEach((connection) => {
                    this.connections.add(connection);
                });
            })
        });
        this.drawConnections();
    }
    drawConnections() {
        for (const connection of this.connections) {
            const startPort = connection.source.port.getBoundingClientRect();
            const start = { x: startPort.x + startPort.width, y: startPort.y + startPort.height / 2, }
            const endPort = connection.port.getBoundingClientRect();
            const end = { x: endPort.x, y: endPort.y + endPort.height / 2, }
            connection.curve = SVGOverlay.addCurve(start, end);
        }
    }
    redrawConnections() {
        for (const connection of this.connections) {
            const startPort = connection.source.port.getBoundingClientRect();
            const start = { x: startPort.x + startPort.width, y: startPort.y + startPort.height / 2, }
            const endPort = connection.port.getBoundingClientRect();
            const end = { x: endPort.x, y: endPort.y + endPort.height / 2, }
            SVGOverlay.editCurve(connection.curve, start, end);
        }
    }
    getConnected(widget) {
        const inputs = widget.inputs.filter((input) => input.source)
            .map((input) => input.source.owner);
        const outputs = widget.outputs.filter((output) => output.connections.size)
            .flatMap((output) => [...output.connections].map((connection) => connection.owner));
        const union = new Set([widget, ...inputs, ...outputs]);
        return [...union];
    }
    getNetwork(widget) {
        const network = [];
        const stack = [widget];
        while (stack.length) {
            const node = stack.shift();
            if (!network.includes(node)) {
                network.push(node);
                const inputs = node.inputs.filter((input) => input.source)
                    .map((input) => input.source.owner);
                const outputs = node.outputs.filter((output) => output.connections.size)
                    .flatMap((output) => [...output.connections].map((connection) => connection.owner));
                stack.push(...inputs, ...outputs);
            }
        }
        return network;
    }
    getAdjacent(widget) {
        const adjoining = [widget];
        const targetBox = widget.docElement.getBoundingClientRect();
        const AdjacencyFactor = 5;

        function commonEdge(box1, box2) {
            return ((Math.abs(box1.left - box2.right) < AdjacencyFactor || Math.abs(box1.left - box2.left) < AdjacencyFactor ||
                        Math.abs(box1.right - box2.right) < AdjacencyFactor || Math.abs(box1.right - box2.left) < AdjacencyFactor) // Common vertical edge
                    &&
                    !(box1.top > box2.bottom || box1.bottom < box2.top)) ||
                ((Math.abs(box1.top - box2.bottom) < AdjacencyFactor || Math.abs(box1.top - box2.top) < AdjacencyFactor ||
                        Math.abs(box1.bottom - box2.bottom) < AdjacencyFactor || Math.abs(box1.bottom - box2.top) < AdjacencyFactor) // Common horizontal edge
                    &&
                    !(box1.left > box2.right || box1.right < box2.left))
        }

        const stack = [widget];
        const widgets = new Set(this.all);
        while (stack.length > 0) {
            const node = stack.shift();
            const nodeBox = node.docElement.getBoundingClientRect();
            for (const widget of widgets) {
                if (node !== widget) {
                    const box = widget.docElement.getBoundingClientRect();
                    if (commonEdge(nodeBox, box)) {
                        adjoining.push(widget);
                        stack.push(widget);
                        widgets.delete(widget);
                    }
                }
            }
        }

        return adjoining;
    }
    save() {
        this.all.forEach((widget) => widget.save());
        const connections = this.all.flatMap(
            (widget) => widget.inputs.filter((input) => input.source)
            .map((input) => ({
                from: { widget: input.source.owner.uuid, output: input.source.id },
                to: { widget: input.owner.uuid, input: input.id }
            })));
        const state = {
            content: 'workspace',
            name: this.name,
            widgets: this.all.map((widget) => {
                const box = widget.docElement.getBoundingClientRect();
                return {
                    uuid: widget.uuid,
                    position: {
                        x: box.x,
                        y: box.y,
                    },
                    size: {
                        width: box.width,
                        height: box.height,
                    }
                }
            }),
            connections
        }
        save(`saved/workspaces/${this.name}.json`, JSON.stringify(state));
    }
}

/*
class Snap {
    constructor(x1, y1, x2, y2, actions) {
        this.box = document.createElement('div');
        this.box.classList.add('snap-box');
        document.body.appendChild(this.box);

        if (x2 === undefined) {
            x2 = x1;
        }
        if (y2 === undefined) {
            y2 = y1;
        }

        this.box.style.left = `${Math.min(x1, x2) - 4}px`;
        this.box.style.top = `${Math.min(y1, y2) - 4}px`;
        this.box.style.width = `${Math.abs(x2 - x1) + 8}px`;
        this.box.style.height = `${Math.abs(y2 - y1) + 8}px`;
        this.box.addEventListener('mousedown', (event) => {
            this.start = { x: event.clientX, y: event.clientY };
            const actions = this.actions.map((action) => (event) => {
                const delta = {
                    x: event.clientX - this.start.x,
                    y: event.clientY - this.start.y,
                }
                action(event, delta)
            });
            actions.forEach((action) =>
                document.body.addEventListener('mousemove', action));

            document.body.addEventListener('mouseup', () =>
                actions.forEach((action) =>
                    document.body.removeEventListener('mousemove', action)));
        });
        this.actions = new Set(actions || []);
    }
    move(dx, dy) {
        const box = this.box.getBoundingClientRect();
        this.box.style.left = `${box.left + dx}px`;
        this.box.style.top = `${box.top + dy}px`;
    }
}

const Group = {
    add(widget) {
        this.members.push(widget);
    }
}

function makeGroup() {
    const group = Object.assign(Object.create(Group), { members: [] });
    group.uuid = UUID.create();
}
*/

function getSnapPoints(ignore) {
    const snapPoints = [];
    for (const widget of App.workspace.all) {
        if (!ignore.includes(widget)) {
            const box = widget.docElement.getBoundingClientRect();
            snapPoints.push({ box, widget });
        }
    }
    return snapPoints;
}

/**
 * Return a list of widgets that share an edge with the target.
 *
 * @param target - element to test
 */
function findAdjoiningElements(target) {
    const adjoining = [];
    const targetBox = target.getBoundingClientRect();
    const AdjacencyFactor = 5;

    function commonEdge(box1, box2) {
        return ((Math.abs(box1.left - box2.right) < AdjacencyFactor || Math.abs(box1.left - box2.left) < AdjacencyFactor ||
                    Math.abs(box1.right - box2.right) < AdjacencyFactor || Math.abs(box1.right - box2.left) < AdjacencyFactor) // Common vertical edge
                &&
                !(box1.top > box2.bottom || box1.bottom < box2.top)) ||
            ((Math.abs(box1.top - box2.bottom) < AdjacencyFactor || Math.abs(box1.top - box2.top) < AdjacencyFactor ||
                    Math.abs(box1.bottom - box2.bottom) < AdjacencyFactor || Math.abs(box1.bottom - box2.top) < AdjacencyFactor) // Common horizontal edge
                &&
                !(box1.left > box2.right || box1.right < box2.left))
    }

    const stack = [targetBox];
    const widgets = new Set(App.workspace.all);
    while (stack.length > 0) {
        const targetBox = stack.shift();
        for (const widget of widgets) {
            if (target !== widget) {
                const box = widget.docElement.getBoundingClientRect();
                if (commonEdge(targetBox, box)) {
                    adjoining.push({ widget, box });
                    stack.push(box);
                    widgets.delete(widget);
                }
            }
        }
    }

    return adjoining;
}

function makeZoomable(node) {
    node.addEventListener('click', (event) => {
        const zoomed = document.getElementsByClassName('zoomed');
        for (const other of zoomed) {
            if (other != node) {
                other.classList.remove('zoomed');
                node.style.transform = `none`;
            }
        }
        const box = node.getBoundingClientRect();
        node.classList.toggle('zoomed');
        node.style.transform = `translate(${10 - box.left}px, ${10 - box.top}px)`;
    });
}

const mouseWatcher = {
    observers: new Set(),
    mouseMove(event) {
        //event.preventDefault();
        this.observers.forEach((observer) => observer(event));
    },
    addObserver(observer) {
        this.observers.add(observer);
    },
    removeObserver(observer) {
        this.observers.delete(observer);
    },
}

const snapSize = { x: 10, y: 10 };

async function getEntries(file, options) {
    return (new zip.ZipReader(new zip.BlobReader(file))).getEntries(options);
}

async function getContent(entry, widget) {
    return await entry.getData(new zip.TextWriter(), {});
}

function refreshList(entries, widget) {
    const list = document.createElement('ul');
    this.docElement.innerHTML = '';
    this.docElement.appendChild(list);
    entries.sort((a, b) => a.filename.localeCompare(b.filename));
    entries.forEach((entry, entryIndex) => {
        const item = document.createElement("li");
        const name = document.createElement("span");
        name.dataset.entryIndex = entryIndex;
        name.textContent = name.title = entry.filename;
        name.title = `${entry.filename}\n  Last modification date: ${entry.lastModDate.toLocaleString()}`;
        if (!entry.directory) {
            name.title += `\n  Uncompressed size: ${entry.uncompressedSize.toLocaleString()} bytes`;
        }
        name.addEventListener('click', async(event) => {
            this.docElement.innerHTML = '';
            const back = document.createElement('span');
            this.docElement.appendChild(back);
            back.innerText = 'Back';
            back.addEventListener('click', (event) => refreshList(entries, widget));
            this.docElement.appendChild(document.createElement(('br')));
            const content = await getContent(entry, widget);
            const pre = document.createElement('pre');
            this.docElement.appendChild(pre);
            pre.innerText = content.replace(/>/g, '>\n');
        });
        item.appendChild(name);
        list.appendChild(item);
    });
}

async function showSheetList(workbook, widget) {
    const list = document.createElement('ul');
    this.docElement.innerHTML = '';
    this.docElement.appendChild(list);

    const worksheets = await workbook.worksheets();
    for (const sheet of worksheets) {
        const item = document.createElement("li");
        const name = document.createElement("span");
        //        name.dataset.entryIndex = entryIndex;
        name.textContent = sheet.name;
        if (sheet.state === 'hidden') {
            name.style.color = 'gray';
        }
        item.appendChild(name);
        list.appendChild(item);
    }
}

async function loadFiles(selectedFile, widget) {
    const entries = await getEntries(selectedFile, {});
    if (entries && entries.length) {
        this.docElement.innerHTML = '';
        refreshList(entries, widget);
    }
}

async function loadExcelFiles(selectedFile, widget) {
    const parser = new DOMParser();
    const entries = await getEntries(selectedFile, {});
    if (entries && entries.length) {
        this.docElement.innerHTML = '';
        const workbookFile = entries.find((entry) => entry.filename === 'xl/workbook.xml');
        if (workbookFile) {
            const xml = await workbookFile.getData(new zip.TextWriter(), {});
            const workbook = parser.parseFromString(xml, 'application/xml');
            showSheetList(workbook, widget);
        }
    }
}

function updateGlobals() {
    const globalsList = document.getElementById('globals');
    if (globalsList) {
        globalsList.innerHTML = '';
        const list = document.createElement('ul');
        globalsList.appendChild(list);
        list.classList.add('varlist');
        const globals = [];
        for (const global in window) {
            if (window.hasOwnProperty(global) && !InitialGlobals.includes(global)) {
                globals.push(global);
            }
        }
        globals.sort();
        globals.forEach((global) => {
            const item = document.createElement('li');
            list.appendChild(item);
            item.innerHTML = global;
        });
    }

}

/**
 * Return the list of files associated with the event.
 *
 * @param event 
 * @returns Array - files associtated with the event
 */
function getFiles(event) {
    const files = [];
    if (event.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (var i = 0; i < event.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (event.dataTransfer.items[i].kind === 'file') {
                files.push(event.dataTransfer.items[i].getAsFile());
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (var i = 0; i < event.dataTransfer.files.length; i++) {
            files.push(file);
        }
    }
    return files;
}

const SVGOverlay = {
    svg: document.getElementById('svg-overlay'),
    initialise() {
        this.box = document.body.getBoundingClientRect();
        this.svg.setAttributeNS("http://www.w3.org/2000/svg", 'viewBox', `0 0 ${this.box.width} ${this.box.height}`);
    },
    clear() {
        this.svg.innerHTML = '';
    },
    remove(element) {
        this.svg.removeChild(element);
    },
    addCurve(start, end) {
        const c1 = {
            x: start.x + 100,
            y: start.y,
        };
        const c2 = {
            x: end.x - 100,
            y: end.y,
        };
        const d = `M ${start.x} ${start.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`;
        const stroke = 'rgb(100, 200, 100)';
        const curve = this.createElement('path', { d, stroke, fill: 'none' });
        this.svg.appendChild(curve);
        return curve;
    },
    editCurve(curve, start, end) {
        const c1 = {
            x: start.x + 100,
            y: start.y,
        };
        const c2 = {
            x: end.x - 100,
            y: end.y,
        };
        const d = `M ${start.x} ${start.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`;
        curve.setAttributeNS(null, 'd', d);
    },
    createElement(element, attrs, attrsNS) {
        const xmlns = 'http://www.w3.org/2000/svg';
        let elem = document.createElementNS(xmlns, element);
        Object.keys(attrs || {}).forEach(key => elem.setAttributeNS(null, key, attrs[key]));
        Object.keys(attrsNS || {}).forEach(namespace =>
            Object.keys(attrsNS[namespace] || {}).elem.setAttributeNS(namespace, key, attrs[key]));
        return elem;
    }
}


class TabBar {
    constructor(id, options = {}) {
        this.history = [];
        const template = document.getElementById('tab-widget-template');
        this.main = template.content.firstElementChild.cloneNode(true);
        this.bar = this.main.querySelector('.tab-bar');
        this.page = this.main.querySelector('.tab-page');
        this.container = document.getElementById(id);
        this.options = options;
        if (this.container) {
            this.container.appendChild(this.main);
        }
        if (this.options.onAddTab) {
            const addTab = document.createElement('button');
            this.bar.appendChild(addTab);
            addTab.innerHTML = '+';
            addTab.classList.add('tab-bar-add-tab');
            addTab.addEventListener('click', (event) => this.addTab());
        }
    }
    newTab(title, content, options = {}) {
        const tab = {
            label: document.createElement('div'),
            content: content || document.createElement('div'),
            options,
        }
        options.onCloseTab = options.onCloseTab || this.options.onCloseTab;
        if (this.options.onAddTab) {
            this.bar.insertBefore(tab.label, this.bar.lastElementChild);
        } else {
            this.bar.appendChild(tab.label);
        }
        tab.label.classList.add('tab-label');
        tab.label.draggable = true;
        tab.label.innerHTML = `<span class="tab-label-text">${title}</span>`;
        tab.label.addEventListener('click', () => this.selectTab(tab));
        if (options.onNameEdit) {
            doubleClickEdit(tab.label.firstElementChild, options.onNameEdit);
        }
        if (options.onCloseTab) {
            const close = document.createElement('button');
            tab.label.appendChild(close);
            close.innerHTML = '&times;';
            close.addEventListener('click', (event) => {
                if (!options.onCloseTab(tab, event)) {
                    this.removeTab(tab);
                }
                event.stopPropagation();
            });
        }
        return tab;
    }
    addTab() {
        const tab = this.newTab(...this.options.onAddTab());
        this.selectTab(tab);
    }
    removeTab(tab) {
        this.bar.removeChild(tab.label);
        const current = this.history[0];
        this.history = this.history.filter((item) => item !== tab);
        if (current === tab) {
            this.page.removeChild(tab.content);
            this.page.appendChild(this.history[0].content);
            this.history[0].label.classList.add('selected-tab-label');
        }
    }
    selectTab(tab) {
        if (tab !== this.history[0]) {
            this.history.unshift(tab);
        }
        for (const label of this.bar.children) {
            label.classList.remove('selected-tab-label');
        }
        if (this.page.firstElementChild) {
            this.page.firstElementChild.replaceWith(tab.content);
        } else {
            this.page.appendChild(tab.content);
        }
        tab.label.classList.add('selected-tab-label');
    }
}

class Controls {
    constructor(container, actions) {
        this.selectionModeNode = container.querySelector('.selection-mode');
        this.snapModenNode = container.querySelector('.snap-mode');
        const save = container.querySelector('.save');
        if (save && actions.save) {
            save.addEventListener('click', actions.save);
        }

        const titleDisplayControl = container.querySelector('.hide-titles-control');
        if (titleDisplayControl && actions.onTitleDisplayChange) {
            titleDisplayControl.addEventListener('change',
                actions.onTitleDisplayChange);
        }
    }
    get selectionMode() {
        return this.selectionModeNode.value;
    }
    get snapMode() {
        return this.snapModeNode.value;
    }

}

const App = {
    iconSet: 'drf/PNG',
    workspaces: [],
    tabbar: new TabBar('main', {
        onAddTab: () => App.addWorkspace('New Workspace'),
        onCloseTab: () => {},
        nameChange: (tab) => {
            tab.item.name = tab.label.innerText;
        },
    }),
    addWorkspace(name) {
        const workspace = new Workspace(name);
        //const tab = this.tabbar.newTab(name, workspace);
        this.workspace = workspace;
        /*
        tab.addButton('&#x1f4be;', () => { workspace.save() });
        tab.addButton('&times;', () => { this.tabbar.remove(tab) });
        this.tabbar.select(tab);
        */
        return [name || 'New Workspace', workspace.docElement];
    },
    removeWorkpace(workspace) {

    },
    async loadWorkspace(name) {
        const jsonState = await load(`saved/workspaces/${name}.json`);
        const state = JSON.parse(jsonState);
        const workspace = new Workspace(name, state);
        const tab = this.tabbar.newTab(state.name, workspace.docElement);
        this.workspace = workspace;
        this.workspaces.push(this.workspace);
        /*
        tab.addButton('&#x1f4be;', () => { workspace.save() });
        tab.addButton('&times;', () => this.tabbar.remove(tab));
        */
        this.tabbar.selectTab(tab);
    },
    getIconPath(iconName) {
        return `icons/${this.iconSet}/${iconName}.png`;
    }
}

function main(event) {
    SVGOverlay.initialise();
    const zoomable = document.getElementsByClassName('zoomable');
    for (const node of zoomable) {
        makeZoomable(node);
    }

    const container = document.getElementById('header');
    document.body.addEventListener('mousemove', (event) => mouseWatcher.mouseMove(event));

    App.loadWorkspace('main');

    const mainBody = document.getElementById('main');
    mainBody.addEventListener('dragover', (event) => event.preventDefault());
    mainBody.addEventListener('drop', (event) => {
        // Prevent default behavior (Prevent file from being opened)
        event.preventDefault();
        const files = getFiles(event);
        files.forEach((file) => App.workspace.addWidget(TextFileView, { file }));
    });

    updateGlobals();

    /*
    const save = document.getElementById('save-all');
    save.addEventListener('click', (event) => {
        document.body.style.cursor = 'wait';
        App.workspace.save();
        document.body.style.cursor = 'auto';
    });
    const fullscreen = document.getElementById('fullscreen');
    fullscreen.addEventListener('click', (event) => {
        if (document.body.requestFullscreen) {
            document.body.requestFullscreen();
        }
        if (document.body.webkitRequestFullscreen) {
            document.body.webkitRequestFullscreen();
        }
    });
    */
}

window.addEventListener('load', event => main(event));