import Gtk from 'gi://Gtk';

/**
 * @typedef {import('@girs/gobject-2.0').default} GObject
 */

/**
 * @typedef {<T extends Function>(name: string, klass: T) => T['prototype']} NewGetObject
 */

/**
 * @typedef {(name: string, obj: any) => void} AddObject
 */

/**
 * @typedef {<T extends Function>(klass: T) => T['prototype']} NewGetCurrentObject
 */

/**
 * A null-safe implementation (wrapper) of {@link Gtk.Builder}.
 *
 * @param {Gtk.Builder} builder
 * @returns {{
 * add_user_object: AddObject;
 * get_user_object: NewGetObject;
 * get_object: NewGetObject;
 * get_current_object: NewGetCurrentObject;
 * } & Gtk.Builder}
 */
const ExtendedBuilder = (builder) => {
	const userObjects = /** @type {{ [key: string]: any }} */({});

	/**
	 * @param {string} name
	 * @param {any} obj
	 */
	const add_user_object = (name, obj) => {
		Object.assign(userObjects, {
			[name]: obj,
		});
	};

	/**
	 * @param {string} name
	 * @param {any} klass
	 */
	const get_user_object = (name, klass) => {
		const obj = userObjects[name];
		if (obj === null)
			throw new Error(`Builder could not retrieve object named \"${name}\" in user space.`);
		if (!(obj instanceof klass))
			throw new Error(`Builder found that object named \"${name}\" is not of type ${klass.name}.`);
		return obj;
	};

	/**
	 * @type {NewGetObject}
	 */
	const get_object = (name, klass) => {
		const obj = builder.get_object(name);
		if (obj === null) throw new Error(`Builder could not retrieve object named \"${name}\" in ui file.`);
		if (!(obj instanceof klass)) throw new Error(`Builder found that object named \"${name}\" is not of type ${klass.name}.`);
		return obj;
	}

	/**
	 * @param {any[]} args
	 */
	const get_object_resolver = (...args) => {
		if (args.length === 2) return get_object.bind(null, ...args)();
		else if (args.length === 1) return builder.get_object.bind(builder, ...args)();
		else throw new Error;
	};

	/**
	 * @type {NewGetCurrentObject}
	 */
	const get_current_object = (klass) => {
		const obj = builder.get_current_object();
		if (obj === null) throw new Error(`Builder could not retrieve current object, possibly not set.`);
		if (!(obj instanceof klass)) throw new Error(`Builder found that current object is not of type ${klass.name}.`);
		return obj;
	};

	// @ts-expect-error Proxy type inference is limited
	return new Proxy(builder, {
		get(obj, property_name, receiver) {
			if (property_name === 'get_object') {
				return get_object_resolver;
			} else if (property_name === 'get_user_object') {
				return get_user_object;
			} else if (property_name === 'add_user_object') {
				return add_user_object;
			} else if (property_name === 'get_current_object') {
				return get_current_object.bind(builder);
			}
			const val = Reflect.get(obj, property_name, receiver);
			if ("apply" in val) return val.bind(obj);
			return val;
		}
	});
};

export default ExtendedBuilder;
