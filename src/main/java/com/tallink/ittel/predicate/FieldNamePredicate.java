package com.tallink.ittel.predicate;

import com.google.common.base.Predicate;

import java.lang.reflect.Field;

import static org.apache.commons.lang.StringUtils.containsIgnoreCase;
import static org.apache.commons.lang.StringUtils.isBlank;

public class FieldNamePredicate implements Predicate<Field> {

	private String methodName;

	public FieldNamePredicate(String methodName) {
		this.methodName = methodName;
	}

	@Override
	public boolean apply(Field input) {
		if (input == null) return false;
		else if (isBlank(methodName)) return false;

		return containsIgnoreCase(methodName, input.getName());
	}
}
