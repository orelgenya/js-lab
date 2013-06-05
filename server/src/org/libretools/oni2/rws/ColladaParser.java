package org.libretools.oni2.rws;

import org.w3c.dom.Document;
import org.w3c.dom.NodeList;

import javax.xml.namespace.QName;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathFactory;
import java.io.*;

/**
 * author: orelgenya
 * Date: 05.06.13
 */
public class ColladaParser {
    public static final String REPO = "C:/Program Files (x86)/Oni/AE/Tools/level1/";
    public static final String EXT = ".dae";

    public static void parse(String name) {
        try {
            File file = new File(REPO + name + EXT);
            if (!file.exists()) return;

            DocumentBuilderFactory domFactory = DocumentBuilderFactory.newInstance();
            domFactory.setNamespaceAware(true); // never forget this!
            DocumentBuilder builder = domFactory.newDocumentBuilder();
            Document doc = builder.parse("books.xml");

            XPathFactory factory = XPathFactory.newInstance();
            XPath xpath = factory.newXPath();
            XPathExpression expr
                    = xpath.compile("//*[@id='door_1_0_position']");

            Object result = expr.evaluate(doc, XPathConstants.NODESET);
            NodeList nodes = (NodeList) result;
            for (int i = 0; i < nodes.getLength(); i++) {
                System.out.println(nodes.item(i).getNodeValue());
            }

        } catch (Exception ex) {
            ex.printStackTrace();
        } finally {
        }
    }

    private static void close(Closeable c) {
        if (c != null) try {
            c.close();
        } catch (Exception ignore) {
        }
    }
}
