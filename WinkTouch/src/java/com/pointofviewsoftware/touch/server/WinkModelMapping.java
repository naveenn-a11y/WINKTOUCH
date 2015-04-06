/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.pointofviewsoftware.touch.server;

import ProgramWritter.DataModelUpdatableGettableByField;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author Christian
 */
public class WinkModelMapping {

    String touchModelName;
    String className;
   
    public WinkModelMapping(String touchModelName, String className) {
        this.touchModelName = touchModelName;
        this.className = className;
       
    }

    public final static List<WinkModelMapping> mapping = new ArrayList();

    static {

        mapping.add(new WinkModelMapping("Store", mypov.data.Store.class.getName()));
        mapping.add(new WinkModelMapping("Country", mypov.data.Country.class.getName()));
        mapping.add(new WinkModelMapping("CountrySubdivision", mypov.data.CountrySubdivision.class.getName()));
        mapping.add(new WinkModelMapping("Product", mypov.data.Product.class.getName()));
        mapping.add(new WinkModelMapping("User", mypov.data.User.class.getName()));
        mapping.add(new WinkModelMapping("Patient", mypov.data.Patient.class.getName()));

        
        
    }
}
