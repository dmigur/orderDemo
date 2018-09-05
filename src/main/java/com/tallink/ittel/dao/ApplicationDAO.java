/**
 * Created by dmitrigu on 22.09.16.
 */

package com.tallink.ittel.dao;

import org.hibernate.CacheMode;
import org.hibernate.Criteria;
import org.hibernate.Query;
import org.hibernate.SessionFactory;
import org.hibernate.criterion.Example;
import org.hibernate.criterion.MatchMode;
import org.hibernate.transform.Transformers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.io.Serializable;
import java.util.Collection;
import java.util.Map;

import static com.google.common.collect.Lists.newArrayList;
import static com.tallink.ittel.ComponentNames.LOCAL_SESSION_FACTORY;
import static com.tallink.ittel.ComponentNames.TRANSACTION_MANAGER;
import static com.tallink.ittel.RepositoryNames.APPLICATION_DAO;
import static com.tallink.ittel.util.DatabaseUtils.*;
import static org.hibernate.criterion.CriteriaSpecification.DISTINCT_ROOT_ENTITY;
import static org.hibernate.criterion.Projections.rowCount;
import static org.springframework.transaction.annotation.Propagation.REQUIRES_NEW;

@Transactional(propagation = REQUIRES_NEW, value = TRANSACTION_MANAGER)
@Repository(value = APPLICATION_DAO)
public class ApplicationDAO {

    @Resource(name = LOCAL_SESSION_FACTORY)
    private SessionFactory sessionFactory;
    private static final Logger LOG = LoggerFactory.getLogger(ApplicationDAO.class);

    public Object create(Object entity) {
        Object id = null;
        if (entity == null) return id;

        try {
            id = sessionFactory.getCurrentSession().save(entity);
        } catch (Exception ex) {
            LOG.error("While trying to save new entity " + entity.getClass().getCanonicalName() + "", ex);
        }

        return id;
    }

    public <T> T fetch(Object id, Class<T> entityClass) {
        if (id == null || entityClass == null) return null;
        return (T) sessionFactory.getCurrentSession().get(entityClass, (Serializable) id);
    }

    public <T> Collection<T> search(Class<T> entityClass) {
        if (entityClass == null) return newArrayList();

        Collection<T> result = newArrayList();
        try {
            Criteria criteria = sessionFactory.getCurrentSession().createCriteria(entityClass);
            criteria.setResultTransformer(DISTINCT_ROOT_ENTITY);

            result.addAll(criteria.list());
        } catch (Exception ex) {
            LOG.error("While trying to execute search query base on examples", ex);
        }

        return result;
    }


    public <T> Collection<T> search(Object searchCriteria) {
        return search(searchCriteria, null, null, false);
    }

    public <T> Collection<T> search(Object searchCriteria, String[] excludeProperties, MatchMode matchMode,
                                    boolean isIgnoreCase) {
        if (searchCriteria == null) return newArrayList();

        Example example = Example.create(searchCriteria);
        example = setExampleIgnoreCase(example, isIgnoreCase);
        example = setExampleLikeMatchMode(example, matchMode);
        example = setExampleExcludeProperties(example, excludeProperties);

        Collection<T> result = newArrayList();
        try {

            Criteria resultCountCriteria = sessionFactory.getCurrentSession().createCriteria(searchCriteria.getClass()).add(example);
            resultCountCriteria.setResultTransformer(DISTINCT_ROOT_ENTITY);
            resultCountCriteria = setCriteriaAdditionalExamples(resultCountCriteria, searchCriteria, matchMode, excludeProperties);
            resultCountCriteria = resultCountCriteria.setProjection(rowCount());

            int firstResult = 0;
            int maxResults = 100;

            Long count = (Long) resultCountCriteria.list().iterator().next();
            if (count >= maxResults) firstResult = count.intValue() - maxResults;

            Criteria criteria = sessionFactory.getCurrentSession().createCriteria(searchCriteria.getClass()).add(example);
            criteria.setResultTransformer(DISTINCT_ROOT_ENTITY);
            criteria.setFirstResult(firstResult);
            criteria.setMaxResults(maxResults);
            criteria = setCriteriaAdditionalExamples(criteria, searchCriteria, matchMode, excludeProperties);

            result.addAll(criteria.list());
        } catch (Exception ex) {
            if (LOG.isErrorEnabled()) LOG.error("While trying to execute search query base on examples", ex);
        }

        return result;
    }

    public void update(Object entity) {
        if (entity == null) return;
        try {
            sessionFactory.getCurrentSession().merge(entity);
        } catch (Exception ex) {
            if (LOG.isWarnEnabled()) LOG.warn("While trying to execute database merge", ex);
            return;
        }
    }

    public void updateAndFlush(Object entity) {
        if (entity == null) return;
        try {
            sessionFactory.getCurrentSession().merge(entity);
            sessionFactory.getCurrentSession().flush();
        } catch (Exception ex) {
            if (LOG.isWarnEnabled()) LOG.warn("While trying to execute database merge", ex);
            return;
        }
    }

    public void save(Object entity) {
        if (entity == null) return;
        try {
            sessionFactory.getCurrentSession().update(entity);
        } catch (Exception ex) {
            if (LOG.isWarnEnabled()) LOG.warn("While trying to execute database merge", ex);
            return;
        }
    }

    public <T> Collection<T> search(String qry, Map<String, Object> params) {
        Collection<T> result = null;
        try {
            Query query = sessionFactory.getCurrentSession().createQuery(qry);
            for (String param : params.keySet()) {
                Object value = params.get(param);
                query.setParameter(param, value);
            }

            query.setCacheable(true);
            query.setCacheMode(CacheMode.GET);
            result = query.list();

        } catch (Exception ex) {
            if (LOG.isWarnEnabled()) LOG.warn("While trying to execute database query", ex);
            LOG.error("Error: ", ex);

        }
        return result;
    }

    public <T> Collection<T> search(String qry, Map<String, Object> params, Class cls) {
        Collection<T> result = null;
        try {
            Query query = sessionFactory.getCurrentSession().createQuery(qry).
                    setResultTransformer(Transformers.aliasToBean(cls));
            for (String param : params.keySet()) {
                Object value = params.get(param);
                query.setParameter(param, value);
            }

            result = query.list();

        } catch (Exception ex) {
            if (LOG.isWarnEnabled()) LOG.warn("While trying to execute database query", ex);

        }
        return result;
    }

    public boolean delete(Object entity) {

        if (entity == null) return false;

        try {
            sessionFactory.getCurrentSession().delete(entity);
        } catch (Exception ex) {
            if (LOG.isWarnEnabled()) LOG.warn("While trying to execute database delete ", ex);
            return false;
        }

        return true;
    }

}
