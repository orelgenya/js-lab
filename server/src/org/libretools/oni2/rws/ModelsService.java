package org.libretools.oni2.rws;

import javax.ws.rs.GET;
import javax.ws.rs.Path;

/**
 * author: orelgenya
 * date: 05.06.13
 */
@Path("model")
public class ModelsService {

    @GET
    public String test() {
        return "Cool Model!";
    }
}
