package com.tallink.ittel.util;

import com.google.common.base.Joiner;
import org.apache.commons.lang.StringUtils;
import org.hibernate.Criteria;
import org.hibernate.criterion.Example;
import org.hibernate.criterion.MatchMode;
import org.hibernate.internal.CriteriaImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.Id;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;

import static com.google.common.base.Joiner.on;
import static com.google.common.collect.Lists.newArrayList;
import static com.google.common.collect.ObjectArrays.newArray;
import static com.tallink.ittel.util.ReflectionUtils.*;
import static jdk.nashorn.internal.objects.NativeString.trim;
import static org.apache.commons.lang.ArrayUtils.isEmpty;
import static org.apache.commons.lang.StringUtils.isBlank;
import static org.apache.commons.lang.StringUtils.split;
import static org.apache.commons.lang.StringUtils.splitByWholeSeparator;
import static org.apache.commons.lang.WordUtils.uncapitalize;
import static org.hibernate.criterion.Example.create;
import static org.hibernate.criterion.MatchMode.EXACT;
import static org.hibernate.criterion.Restrictions.eq;

/**
 * Created by dmitrigu on 12.09.16.
 */
public class DatabaseUtils {

	private static final Logger LOG = LoggerFactory.getLogger(DatabaseUtils.class);

	public static Object getId(final Object entity) {
		Object id = null;
		if (entity == null) return id;

		for (Method method : entity.getClass().getDeclaredMethods()) {
			if (method.getParameterTypes().length != 0) continue;
			else if (method.getAnnotation(Id.class) == null) continue;

			try {
				return method.invoke(entity);
			} catch (IllegalAccessException | InvocationTargetException ex) {
				if (LOG.isErrorEnabled()) LOG.error("While trying to invoke method", ex);
			}
		}

		return id;
	}

	public static Example setExampleIgnoreCase(Example source, boolean isIgnoreCase) {
		if (source == null) return source;
		if (isIgnoreCase) source.ignoreCase();

		return source;
	}

	public static Example setExampleLikeMatchMode(Example source, MatchMode matchMode) {
		if (source == null) return source;
		if (matchMode != null) source.enableLike(matchMode);

		return source;
	}

	public static Example setExampleExcludeProperties(Example source, String... excludeProperties) {
		if (source == null) return source;
		if (isEmpty(excludeProperties)) return source;

		for (String excludeProperty : excludeProperties) {
			if (excludeProperty.contains(".")) continue;
			source.excludeProperty(trim(excludeProperty));
		}

		return source;
	}

	private static Criteria setCriteriaAdditionalExamples(Criteria source, Object rootEntity, Object entity,
                                                          String... excludeProperties) {
		return setCriteriaAdditionalExamples(source, rootEntity, entity, EXACT, excludeProperties);
	}

	public static Criteria setCriteriaAdditionalExamples(Criteria source, Object entity, MatchMode matchMode,
                                                         String... excludeProperties) {
		return setCriteriaAdditionalExamples(source, entity, entity, matchMode, excludeProperties);
	}

	private static Criteria setCriteriaAdditionalExamples(Criteria source, Object rootEntity, Object entity,
                                                          MatchMode matchMode,
                                                          String... excludeProperties) {
		if (source == null || entity == null) return null;

		Field[] fields = entity.getClass().getDeclaredFields();
		for (Field field : fields) {
			Class<?> fieldType = field.getType();
			Package fieldPackage = field.getType().getPackage();

			if (fieldType.isArray()) continue;
			else if (fieldType.isEnum()) continue;
			else if (fieldType.isPrimitive()) continue;
			else if (!"com.tallink.ittel.dao.model.domain".equals(fieldPackage.getName())) continue;

			Object associatedEntity = getFieldValue(entity, field);
			if (associatedEntity == null) continue;

			if (isPrimaryKeyUsedAsSearchCriteria(associatedEntity)) {
				String associatedEntityPropertyName = getAssociatedEntityPrimaryKeyPropertyName(rootEntity, associatedEntity);

				ArrayList<String> properties = newArrayList(split(associatedEntityPropertyName, "."));
				if (properties.size() > 2) source = setAdditionalSubCriteriaProperties(source, properties);
				else source = source.add(eq(associatedEntityPropertyName, getPrimaryKeyValue(associatedEntity)));
				continue;
			}

			String[] filteredExcludeProperties = filterExcludeProperties(field.getName(), excludeProperties);
			Example example = setExampleExcludeProperties(create(associatedEntity), filteredExcludeProperties);
			example = setExampleLikeMatchMode(example, matchMode);
			example = setExampleIgnoreCase(example, false);

			source.createCriteria(uncapitalize(associatedEntity.getClass().getSimpleName())).add(example);
			setCriteriaAdditionalExamples(source, rootEntity, associatedEntity, filteredExcludeProperties);
		}

		return source;
	}

	private static Criteria setAdditionalSubCriteriaProperties(Criteria source, ArrayList<String> properties) {
		ArrayList<CriteriaImpl.Subcriteria> subCriteriaList = getAvailableSubCriteriaList(((CriteriaImpl) source).iterateSubcriteria());
		for (int i = 0; i < subCriteriaList.size(); i++) {
			CriteriaImpl.Subcriteria subCriteria = subCriteriaList.get(i);
			if (!StringUtils.equals(subCriteria.getPath(), properties.iterator().next())) continue;

			for (String property : properties) {
				if (properties.indexOf(property) == 0) continue;
				else if (properties.indexOf(property) == properties.size() - 1)
					subCriteria = (CriteriaImpl.Subcriteria) subCriteria.add(eq(property, 1));
				else subCriteria = (CriteriaImpl.Subcriteria) subCriteria.createCriteria(property);
			}
		}

		return source;
	}

	private static ArrayList<CriteriaImpl.Subcriteria> getAvailableSubCriteriaList(
			Iterator<CriteriaImpl.Subcriteria> iterator) {
		ArrayList<CriteriaImpl.Subcriteria> subCriteriaList = newArrayList();
		if (iterator == null) return subCriteriaList;

		while (iterator.hasNext()) {
			subCriteriaList.add(iterator.next());
		}

		return subCriteriaList;
	}

	private static String getAssociatedEntityPrimaryKeyPropertyName(Object rootEntity, Object associatedEntity) {
		String simpleName = uncapitalize(getEntityPath(rootEntity, rootEntity.getClass(), associatedEntity.getClass(), null));

		Joiner joiner;
		if (isBlank(simpleName)) joiner = on("");
		else joiner = on(".");

		return joiner.join(simpleName, getFieldName(associatedEntity, getPrimaryKeyMethod(associatedEntity)));
	}

	private static String getEntityPath(Object entity, Class<?> rootEntityClass, Class<?> searchEntityClass,
                                        String path) {
		String newPath;
		if (path == null) newPath = "";
		else newPath = path;

		ArrayList<Field> fields = newArrayList(entity.getClass().getDeclaredFields());
		for (Field field : fields) {
			Class<?> fieldType = field.getType();
			Package fieldPackage = field.getType().getPackage();

			if (fieldType.isArray()) {
				if (isLastField(fields, field) && entity.getClass() != rootEntityClass) newPath = "";
				continue;
			} else if (fieldType.isEnum()) {
				if (isLastField(fields, field) && entity.getClass() != rootEntityClass) newPath = "";
				continue;
			} else if (fieldType.isPrimitive()) {
				if (isLastField(fields, field) && entity.getClass() != rootEntityClass) newPath = "";
				continue;
			} else if (!"com.tallink.ittel.dao.model.domain".equals(fieldPackage.getName())) {
				if (isLastField(fields, field) && entity.getClass() != rootEntityClass) newPath = "";
				continue;
			}

			Object associatedEntity = getFieldValue(entity, field);
			if (associatedEntity == null) continue;

			if (isBlank(newPath)) newPath = newPath.concat(field.getName());
			else newPath = newPath.concat(".").concat(field.getName());

			if (associatedEntity.getClass() == searchEntityClass) return newPath;

			newPath = getEntityPath(associatedEntity, rootEntityClass, searchEntityClass, newPath);
			if (entity.getClass() == rootEntityClass) newPath = "";
		}

		return newPath;
	}

	private static Object getPrimaryKeyValue(Object entity) {
		if (entity == null) return null;

		Method method = getPrimaryKeyMethod(entity);
		if (method == null) return false;

		return getFieldValue(entity, method);
	}

	private static Method getPrimaryKeyMethod(Object entity) {
		if (entity == null) return null;

		Method[] methods = entity.getClass().getDeclaredMethods();
		for (Method method : methods) {
			if (method.getAnnotation(Id.class) != null) return method;
		}

		return null;
	}

	private static boolean isPrimaryKeyUsedAsSearchCriteria(Object entity) {
		if (entity == null) return false;

		Method method = getPrimaryKeyMethod(entity);
		if (method == null) return false;
		else if (getFieldValue(entity, method) != null) return true;

		return false;
	}

	private static String[] filterExcludeProperties(String fieldName, String... excludeProperties) {
		if (isBlank(fieldName) || isEmpty(excludeProperties)) return newArray(String.class, 0);

		Collection<String> filteredExcludeProperties = newArrayList();
		for (String excludeProperty : excludeProperties) {
			excludeProperty = trim(excludeProperty);

			if (isBlank(excludeProperty)) continue;
			else if (!excludeProperty.contains(".")) continue;

			if (!excludeProperty.contains(fieldName)) {
				filteredExcludeProperties.add(excludeProperty);
				continue;
			}

			String[] excludePropertyArray = splitByWholeSeparator(excludeProperty, ".", 2);
			if (excludePropertyArray.length != 2) continue;

			filteredExcludeProperties.add(excludePropertyArray[1]);
		}

		return filteredExcludeProperties.toArray(newArray(String.class, filteredExcludeProperties.size()));
	}

}