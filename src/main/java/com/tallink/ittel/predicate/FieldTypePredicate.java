package com.tallink.ittel.predicate;

import com.google.common.base.Predicate;

import java.lang.reflect.Field;

public class FieldTypePredicate implements Predicate<Field> {

	private Class<?> type;

	public FieldTypePredicate(Class<?> type) {
		this.type = type;
	}

	@Override
	public boolean apply(Field input) {
		if (input == null) return false;
		else if (type == null) return false;

		return input.getType().equals(type);
	}
}
