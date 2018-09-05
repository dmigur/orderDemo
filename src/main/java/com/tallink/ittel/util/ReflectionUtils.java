package com.tallink.ittel.util;

import com.tallink.ittel.predicate.FieldNamePredicate;
import com.tallink.ittel.predicate.FieldTypePredicate;
import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.lang.ObjectUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang.time.DateUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.UnsupportedEncodingException;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;

import static com.google.common.collect.Collections2.filter;
import static java.util.Arrays.asList;
import static java.util.Calendar.SECOND;
import static org.apache.commons.collections.CollectionUtils.isEmpty;
import static org.apache.commons.collections.CollectionUtils.isNotEmpty;
import static org.apache.commons.lang.StringUtils.*;

/**
 * Created by dmitrigu on 12.09.16.
 */
public class ReflectionUtils {

    private static final Logger LOG = LoggerFactory.getLogger(ReflectionUtils.class);

    public static Class<?> getClassForName(String className) {
        Class<?> objectClass = null;
        if (isBlank(className)) return objectClass;

        try {
            return Class.forName(className);
        } catch (ClassNotFoundException ex) {
            if (LOG.isErrorEnabled()) LOG.error("While trying to create instance of object [" + className + "]", ex);
        }

        return objectClass;
    }

    public static Object getFieldValue(Object source, Field field) {
        Object entity = null;
        if (source == null || field == null) return entity;

        for (Method method : source.getClass().getDeclaredMethods()) {
            if (method.getReturnType() == null || !field.getType().equals(method.getReturnType())) continue;

            try {
                return method.invoke(source);
            } catch (IllegalAccessException | InvocationTargetException ex) {
                return entity;
            }
        }

        return entity;
    }

    public static boolean isLastField(ArrayList<Field> fields, Field field) {
        if (isEmpty(fields)) return false;
        else if (field == null) return false;

        return fields.indexOf(field) == (fields.size() - 1);
    }

    public static String getFieldName(Object source, Method method) {
        String fieldName = null;
        if (source == null) return fieldName;
        else if (method == null) return fieldName;

        try {
            source.getClass().getDeclaredMethod(method.getName(), method.getParameterTypes());
        } catch (NoSuchMethodException ex) {
            if (LOG.isDebugEnabled())
                LOG.debug("While trying to find method " + method.getName() + " in class " + source.getClass().getName() + "", ex);
            return fieldName;
        }

        Collection<Field> fields = filter(asList(source.getClass().getDeclaredFields()), new FieldTypePredicate(method.getReturnType()));
        if (isEmpty(fields)) return fieldName;
        else if (isNotEmpty(fields) && fields.size() == 1) return fields.iterator().next().getName();

        fields = filter(fields, new FieldNamePredicate(method.getName()));
        if (isEmpty(fields)) return fieldName;
        else if (isNotEmpty(fields) && fields.size() == 1) return fields.iterator().next().getName();

        if (LOG.isErrorEnabled())
            LOG.error("Can not find field name base on method " + method.getName() + " in class " + source.getClass());

        return fieldName;
    }

    public static Object getFieldValue(Object source, Method method) {
        Object entity = null;
        if (source == null || method == null) return entity;

        try {
            return method.invoke(source);
        } catch (IllegalAccessException | InvocationTargetException ex) {
            return entity;
        }
    }

    private static Field getField(final Object source, final String fieldName) {
        for (Field field : source.getClass().getDeclaredFields()) {
            if (!field.getName().equalsIgnoreCase(fieldName)) continue;
            return field;
        }

        return null;
    }

    private static Object getFieldValue(final Object source, final String[] fieldPath) {
        if (ArrayUtils.isEmpty(fieldPath) || source == null) return null;

        for (String currentPath : fieldPath) {
            try {
                Field currentField = getField(source, currentPath);
                if (currentField == null) {
                    if (LOG.isDebugEnabled()) LOG.debug("Field [" + currentPath
                            + "] ignored! Reason: field with such name not found in source object!");
                    continue;
                }

                Method currentMethod = source.getClass().getDeclaredMethod(
                        getMethodName(currentPath, currentField.getType()));

                if (ArrayUtils.indexOf(fieldPath, currentPath) == (fieldPath.length - 1))
                    return currentMethod.invoke(source);

                return getFieldValue(currentMethod.invoke(source),
                        (String[]) ArrayUtils.removeElement(fieldPath, currentPath));
            } catch (Exception ex) {
                if (LOG.isDebugEnabled()) LOG.debug("While trying to get field", ex);
            }
        }

        return null;
    }

    private static String getMethodName(final String fieldName, final Class<?> fieldType) {
        String methodName;
        if (fieldType == boolean.class || fieldType == Boolean.class) methodName = "is";
        else methodName = "get";

        return methodName.concat(capitalize(fieldName));
    }

    public static boolean isSame(final Object object1, final Object object2, final String... comparableFields) {
        if (ArrayUtils.isEmpty(comparableFields)) return true;

        for (String comparableField : comparableFields) {
            Object object1Value = getFieldValue(object1, splitPreserveAllTokens(comparableField, "."));
            Object object2Value = getFieldValue(object2, splitPreserveAllTokens(comparableField, "."));

            if (object1Value instanceof String && object2Value instanceof String) {
                // Transform to UTF-8
                String object1UTF8Value = null;
                String object2UTF8Value = null;

                try {
                    object1UTF8Value = new String(String.valueOf(object1Value).getBytes("UTF-8"), "UTF-8");
                    object2UTF8Value = new String(String.valueOf(object2Value).getBytes("UTF-8"), "UTF-8");
                } catch (UnsupportedEncodingException ex) {
                    if (LOG.isDebugEnabled()) LOG.debug("While trying to transform string using UTF-8 encoding", ex);
                }

                if (!StringUtils.equals(object1UTF8Value, object2UTF8Value)) {
                    if (LOG.isDebugEnabled())
                        LOG.debug("Compare field [" + comparableField + "] value. Expected value[" + object2Value
                                + "] & actual value[" + object1Value + "]!");
                    return false;
                }
            } else if (object1Value instanceof Calendar && object2Value instanceof Calendar) {
                if (object1Value == null && object2Value == null) continue;

                Calendar object1CalenderValue = DateUtils.truncate(Calendar.getInstance(), SECOND);
                object1CalenderValue.setTime(((Calendar) object1Value).getTime());

                Calendar object2CalenderValue = DateUtils.truncate(Calendar.getInstance(), SECOND);
                object2CalenderValue.setTime(((Calendar) object2Value).getTime());

                if (object1CalenderValue.compareTo(object2CalenderValue) != 0) {
                    if (LOG.isDebugEnabled()) LOG.debug("Compare field [" + comparableField + "] value. Expected value["
                            + object2CalenderValue.getTime() + "] & actual value[" + object1CalenderValue.getTime()
                            + "]!");
                    return false;
                }
            } else {
                if (!ObjectUtils.equals(object1Value, object2Value)) {
                    if (LOG.isDebugEnabled())
                        LOG.debug("Compare field [" + comparableField + "] value. Expected value[" + object2Value
                                + "] & actual value[" + object1Value + "]!");
                    return false;
                }
            }
        }

        return true;
    }
}
