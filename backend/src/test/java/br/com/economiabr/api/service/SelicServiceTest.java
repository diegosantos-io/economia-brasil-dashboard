package br.com.economiabr.api.service;

import br.com.economiabr.api.client.BancoCentralClient;
import br.com.economiabr.api.dto.SelicResponse;

import tools.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SelicServiceTest {

    private BancoCentralClient bancoCentralClient;
    private SelicService selicService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        bancoCentralClient = mock(BancoCentralClient.class);
        selicService = new SelicService(bancoCentralClient);
        objectMapper = new ObjectMapper();
    }

    @Test
    void deveRetornarHistoricoDaSelic() throws Exception {

        var json = objectMapper.readTree("""
            [
                {"data":"01/10/2026","valor":"13,75"},
                {"data":"02/10/2026","valor":"13,75"}
            ]
            """);

        when(bancoCentralClient.buscarSelic(30)).thenReturn(json);

        List<SelicResponse> resultado =
                selicService.buscarHistorico(30);

        assertEquals(2, resultado.size());
        assertEquals("01/10/2026", resultado.get(0).data());
        assertEquals(13.75, resultado.get(0).valor(), 0.001);
        assertEquals("% a.a.", resultado.get(0).unidade());
        assertEquals("Meta Selic", resultado.get(0).indicador());
    }

    @Test
    void deveLancarErroQuandoRespostaEstiverVazia() throws Exception {

        var json = objectMapper.readTree("[]");

        when(bancoCentralClient.buscarSelic(30)).thenReturn(json);

        assertThrows(
                IllegalStateException.class,
                () -> selicService.buscarHistorico(30)
        );
    }

    @Test
    void deveIgnorarRegistrosSemDados() throws Exception {

        var json = objectMapper.readTree("""
            [
                {"data":"","valor":""},
                {"data":"01/10/2026","valor":"13,75"}
            ]
            """);

        when(bancoCentralClient.buscarSelic(30)).thenReturn(json);

        List<SelicResponse> resultado =
                selicService.buscarHistorico(30);

        assertEquals(1, resultado.size());
        assertEquals(13.75, resultado.get(0).valor(), 0.001);
    }
}
