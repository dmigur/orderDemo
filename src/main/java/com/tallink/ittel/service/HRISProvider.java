package com.tallink.ittel.service;

import org.springframework.stereotype.Component;
import javax.annotation.Resource;

/**
 * Created by dmitrigu on 02.07.18.
 */
@Component
public class HRISProvider {


    public com.tallink.ittel.ws.client.api.hris.HRIS getHRIS() {
        return HRIS;
    }

    @Resource(name = "HRIS")
    private com.tallink.ittel.ws.client.api.hris.HRIS HRIS;


}