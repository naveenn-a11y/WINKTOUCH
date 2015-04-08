/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.pointofviewsoftware.touch.server;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;

/**
 * Use to dynamically build the model classes based on mypov.data.*
 * @author Christian
 */
public class CreateModel {

    public static void main(String[] args) throws Exception {
        File folderModel = new File("C:\\git\\pov\\WinkTouch\\web\\app\\model");
        File folderModelStatic = new File("C:\\git\\pov\\WinkTouch\\web\\app\\model-static");
        if (folderModel.exists()) {
            for (File f : folderModel.listFiles()) {
                f.delete();
            }
        }
        folderModel.mkdir();
        for (File f : folderModelStatic.listFiles()) {
            File fOut = new File(folderModel.getAbsolutePath() + File.separator + f.getName());
            System.err.println(fOut.getAbsolutePath() + " from " + f.getAbsolutePath());
            fOut.createNewFile();
            FileInputStream in = new FileInputStream(f);
            FileOutputStream out = new FileOutputStream(fOut);
            byte[] buffer = new byte[1000];
            int count = in.read(buffer);
            while (count > 0) {
                out.write(buffer, 0, count);
                count = in.read(buffer);
            }
            in.close();
            out.close();
        }
        //replace existing from servlet
        for (WinkModelMapping m : WinkModelMapping.mapping) {
            File fOut = new File(folderModel.getAbsolutePath() + File.separator + m.touchModelName + ".js");
            System.err.println(fOut.getAbsolutePath());
            fOut.createNewFile();
            URL u = new URL("http://localhost:8080/WinkTouch/app/model/" + m.touchModelName + ".js");
            InputStream in = u.openStream();
            FileOutputStream out = new FileOutputStream(fOut);
            byte[] buffer = new byte[1000];
            int count = in.read(buffer);
            while (count > 0) {
                out.write(buffer, 0, count);
                count = in.read(buffer);
            }
            in.close();
            out.close();
        }

    }
}
