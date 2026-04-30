CREATE POLICY "dueño puede ver visitas de su anuncio" ON public.anuncio_visitas AS PERMISSIVE FOR SELECT TO public USING ((anuncio_id IN ( SELECT anuncios.id
   FROM anuncios
  WHERE (anuncios.usuario_id = auth.uid()))));
CREATE POLICY "usuarios pueden insertar visitas" ON public.anuncio_visitas AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = visitante_id));
CREATE POLICY "Anuncios publicos" ON public.anuncios AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Dueño puede actualizar su anuncio" ON public.anuncios AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = usuario_id));
CREATE POLICY "Insertar anuncios" ON public.anuncios AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Usuarios pueden editar sus anuncios" ON public.anuncios AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = usuario_id));
CREATE POLICY "Usuarios pueden insertar anuncios" ON public.anuncios AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = usuario_id));
CREATE POLICY "Ver anuncios activos" ON public.anuncios AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY anuncios_public_read ON public.anuncios AS PERMISSIVE FOR SELECT TO public USING ((estado = 'activo'::text));
CREATE POLICY usuarios_pueden_borrar_sus_anuncios ON public.anuncios AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = usuario_id));
CREATE POLICY "Lectura pública barrios" ON public.barrios AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_bits_promo_descargas_all ON public.bits_promo_descargas AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY bits_promo_descargas_insert ON public.bits_promo_descargas AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY bits_promo_descargas_select ON public.bits_promo_descargas AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = usuario_id));
CREATE POLICY service_role_only ON public.bot_mensajes AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));
CREATE POLICY "usuarios pueden ver sus matches" ON public.busqueda_matches AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = usuario_id));
CREATE POLICY busquedas_delete_own ON public.busquedas_automaticas AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = usuario_id));
CREATE POLICY busquedas_insert_own ON public.busquedas_automaticas AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = usuario_id));
CREATE POLICY busquedas_select_own ON public.busquedas_automaticas AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = usuario_id));
CREATE POLICY busquedas_update_own ON public.busquedas_automaticas AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = usuario_id));
CREATE POLICY "usuario ve sus busquedas" ON public.busquedas_automaticas AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = usuario_id));
CREATE POLICY "Lectura pública ciudades" ON public.ciudades AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY service_role_only ON public.conexiones AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));
CREATE POLICY service_role_only ON public.conexiones_nexo AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));
CREATE POLICY "Solo admin" ON public.config AS PERMISSIVE FOR ALL TO public USING (true);
CREATE POLICY service_role_only ON public.config_app AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));
CREATE POLICY admin_all ON public.config_global AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin = true)))));
CREATE POLICY pub_select ON public.config_global AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_contactos ON public.contactos_nexonet AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY copyright_claims_insert ON public.copyright_claims AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY copyright_claims_select ON public.copyright_claims AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY empresa_filtros_public ON public.empresa_filtros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY empresa_pagos_insert ON public.empresa_pagos AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = usuario_id));
CREATE POLICY empresa_pagos_select ON public.empresa_pagos AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_write_empresa_rubros ON public.empresa_rubros AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true)))));
CREATE POLICY empresa_rubros_public ON public.empresa_rubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY escritura_service_role ON public.empresa_rubros AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));
CREATE POLICY lectura_publica ON public.empresa_rubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY read_empresa_rubros ON public.empresa_rubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_write_empresa_subrubros ON public.empresa_subrubros AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true)))));
CREATE POLICY empresa_subrubros_public ON public.empresa_subrubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY escritura_service_role ON public.empresa_subrubros AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));
CREATE POLICY lectura_publica ON public.empresa_subrubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY read_empresa_subrubros ON public.empresa_subrubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Filtros publicos" ON public.filtros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_all ON public.filtros_busqueda_ia AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin = true)))));
CREATE POLICY pub_select ON public.filtros_busqueda_ia AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY cats_read ON public.grupo_categorias AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY pub_select ON public.grupo_categorias AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY evt_del ON public.grupo_eventos AS PERMISSIVE FOR DELETE TO public USING ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_eventos.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.rol = ANY (ARRAY['creador'::text, 'moderador'::text])) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY evt_ins ON public.grupo_eventos AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_eventos.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.rol = ANY (ARRAY['creador'::text, 'moderador'::text])) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY evt_read ON public.grupo_eventos AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_eventos.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY evt_upd ON public.grupo_eventos AS PERMISSIVE FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_eventos.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.rol = ANY (ARRAY['creador'::text, 'moderador'::text])) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY plano_del ON public.grupo_planos AS PERMISSIVE FOR DELETE TO public USING ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_planos.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.rol = ANY (ARRAY['creador'::text, 'moderador'::text])) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY plano_ins ON public.grupo_planos AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_planos.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.rol = ANY (ARRAY['creador'::text, 'moderador'::text])) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY plano_read ON public.grupo_planos AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_planos.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY prov_del ON public.grupo_proveedores AS PERMISSIVE FOR DELETE TO public USING ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_proveedores.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.rol = ANY (ARRAY['creador'::text, 'moderador'::text])) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY prov_ins ON public.grupo_proveedores AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_proveedores.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.rol = ANY (ARRAY['creador'::text, 'moderador'::text])) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY prov_read ON public.grupo_proveedores AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_proveedores.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY prov_upd ON public.grupo_proveedores AS PERMISSIVE FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_proveedores.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.rol = ANY (ARRAY['creador'::text, 'moderador'::text])) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY res_del ON public.grupo_residentes AS PERMISSIVE FOR DELETE TO public USING ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_residentes.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.rol = ANY (ARRAY['creador'::text, 'moderador'::text])) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY res_ins ON public.grupo_residentes AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_residentes.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.rol = ANY (ARRAY['creador'::text, 'moderador'::text])) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY res_read ON public.grupo_residentes AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_residentes.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY res_upd ON public.grupo_residentes AS PERMISSIVE FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_residentes.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.rol = ANY (ARRAY['creador'::text, 'moderador'::text])) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY svc_del ON public.grupo_servicios AS PERMISSIVE FOR DELETE TO public USING ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_servicios.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.rol = ANY (ARRAY['creador'::text, 'moderador'::text])) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY svc_ins ON public.grupo_servicios AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_servicios.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.rol = ANY (ARRAY['creador'::text, 'moderador'::text])) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY svc_read ON public.grupo_servicios AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_servicios.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY svc_upd ON public.grupo_servicios AS PERMISSIVE FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM grupo_miembros
  WHERE ((grupo_miembros.grupo_id = grupo_servicios.grupo_id) AND (grupo_miembros.usuario_id = auth.uid()) AND (grupo_miembros.rol = ANY (ARRAY['creador'::text, 'moderador'::text])) AND (grupo_miembros.estado = 'activo'::text)))));
CREATE POLICY pub_select ON public.grupo_subcategorias AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY subcats_read ON public.grupo_subcategorias AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_grupos ON public.grupos AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY grupos_ins ON public.grupos AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = creador_id));
CREATE POLICY grupos_read ON public.grupos AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY lectura_publica_grupos ON public.grupos AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Insignias visibles para todos" ON public.insignias_reputacion AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Usuarios autenticados pueden dar insignias" ON public.insignias_reputacion AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = dador_id));
CREATE POLICY admin_all ON public.log_bits_internos AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin = true)))));
CREATE POLICY admin_puede_leer ON public.log_bits_internos AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY service_role_lectura ON public.log_bits_internos AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'service_role'::text));
CREATE POLICY log_fallos_select_admin ON public.log_fallos_sistema AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true)))));
CREATE POLICY log_fallos_update_admin ON public.log_fallos_sistema AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true)))));
CREATE POLICY admin_all ON public.log_socios_comerciales AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin = true)))));
CREATE POLICY socio_own ON public.log_socios_comerciales AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM socios_comerciales
  WHERE ((socios_comerciales.id = log_socios_comerciales.socio_id) AND (socios_comerciales.usuario_id = auth.uid())))));
CREATE POLICY mensajes_insert ON public.mensajes AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY mensajes_participantes ON public.mensajes AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = emisor_id) OR (auth.uid() = receptor_id)));
CREATE POLICY mensajes_update_leido ON public.mensajes AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = receptor_id));
CREATE POLICY admin_all ON public.mensajes_soporte AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin = true)))));
CREATE POLICY insert_all ON public.mensajes_soporte AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY select_own ON public.mensajes_soporte AS PERMISSIVE FOR SELECT TO public USING ((usuario_id = auth.uid()));
CREATE POLICY admin_all ON public.nexo_descarga_solicitudes AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true)))));
CREATE POLICY usuario_own ON public.nexo_descarga_solicitudes AS PERMISSIVE FOR ALL TO public USING ((solicitante_id = auth.uid())) WITH CHECK ((solicitante_id = auth.uid()));
CREATE POLICY admin_nexo_descargas_all ON public.nexo_descargas AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY descargas_admin ON public.nexo_descargas AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM nexos
  WHERE ((nexos.id = nexo_descargas.nexo_id) AND (nexos.usuario_id = auth.uid())))));
CREATE POLICY descargas_ver ON public.nexo_descargas AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_nexo_descargas_pagos_all ON public.nexo_descargas_pagos AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY pagos_insertar ON public.nexo_descargas_pagos AS PERMISSIVE FOR INSERT TO public WITH CHECK ((comprador_id = auth.uid()));
CREATE POLICY pagos_propios ON public.nexo_descargas_pagos AS PERMISSIVE FOR SELECT TO public USING (((comprador_id = auth.uid()) OR (admin_id = auth.uid())));
CREATE POLICY nexo_flash_all ON public.nexo_flash_envios AS PERMISSIVE FOR ALL TO public USING (true);
CREATE POLICY nexo_horarios_all ON public.nexo_horarios AS PERMISSIVE FOR ALL TO public USING (true);
CREATE POLICY admin_nexo_mensajes_all ON public.nexo_mensajes AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY mensajes_borrar ON public.nexo_mensajes AS PERMISSIVE FOR DELETE TO public USING (((usuario_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM nexos
  WHERE ((nexos.id = nexo_mensajes.nexo_id) AND (nexos.usuario_id = auth.uid()))))));
CREATE POLICY mensajes_enviar ON public.nexo_mensajes AS PERMISSIVE FOR INSERT TO public WITH CHECK ((usuario_id = auth.uid()));
CREATE POLICY mensajes_ver ON public.nexo_mensajes AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_nexo_miembros_all ON public.nexo_miembros AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY miembros_propios ON public.nexo_miembros AS PERMISSIVE FOR ALL TO public USING ((usuario_id = auth.uid()));
CREATE POLICY miembros_ver ON public.nexo_miembros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY nexo_plantillas_all ON public.nexo_plantillas_mensaje AS PERMISSIVE FOR ALL TO public USING (true);
CREATE POLICY nexo_resenas_all ON public.nexo_resenas AS PERMISSIVE FOR ALL TO public USING (true);
CREATE POLICY escritura_service_role ON public.nexo_slider_anuncios AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));
CREATE POLICY lectura_publica ON public.nexo_slider_anuncios AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_nexo_slider_items_all ON public.nexo_slider_items AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY items_admin ON public.nexo_slider_items AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM nexos
  WHERE ((nexos.id = nexo_slider_items.nexo_id) AND (nexos.usuario_id = auth.uid())))));
CREATE POLICY items_visibles ON public.nexo_slider_items AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_nexo_sliders_all ON public.nexo_sliders AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY miembros_pueden_actualizar_sliders ON public.nexo_sliders AS PERMISSIVE FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM nexo_miembros
  WHERE ((nexo_miembros.nexo_id = nexo_sliders.nexo_id) AND (nexo_miembros.usuario_id = auth.uid()) AND (nexo_miembros.rol = ANY (ARRAY['creador'::text, 'admin'::text])) AND (nexo_miembros.estado = 'activo'::text)))));
CREATE POLICY miembros_pueden_eliminar_sliders ON public.nexo_sliders AS PERMISSIVE FOR DELETE TO public USING ((EXISTS ( SELECT 1
   FROM nexo_miembros
  WHERE ((nexo_miembros.nexo_id = nexo_sliders.nexo_id) AND (nexo_miembros.usuario_id = auth.uid()) AND (nexo_miembros.rol = ANY (ARRAY['creador'::text, 'admin'::text])) AND (nexo_miembros.estado = 'activo'::text)))));
CREATE POLICY miembros_pueden_insertar_sliders ON public.nexo_sliders AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM nexo_miembros
  WHERE ((nexo_miembros.nexo_id = nexo_sliders.nexo_id) AND (nexo_miembros.usuario_id = auth.uid()) AND (nexo_miembros.rol = ANY (ARRAY['creador'::text, 'admin'::text])) AND (nexo_miembros.estado = 'activo'::text)))));
CREATE POLICY sliders_admin ON public.nexo_sliders AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM nexos
  WHERE ((nexos.id = nexo_sliders.nexo_id) AND (nexos.usuario_id = auth.uid())))));
CREATE POLICY sliders_visibles ON public.nexo_sliders AS PERMISSIVE FOR SELECT TO public USING ((activo = true));
CREATE POLICY admin_nexo_visitas_all ON public.nexo_visitas AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY admin_nexos_delete ON public.nexos AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY admin_nexos_update ON public.nexos AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY nexos_delete_auth ON public.nexos AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = usuario_id));
CREATE POLICY nexos_insert_auth ON public.nexos AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = usuario_id));
CREATE POLICY nexos_propios ON public.nexos AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = usuario_id));
CREATE POLICY nexos_publicos ON public.nexos AS PERMISSIVE FOR SELECT TO public USING ((estado = 'activo'::text));
CREATE POLICY nexos_select_public ON public.nexos AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY nexos_update_auth ON public.nexos AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = usuario_id));
CREATE POLICY "Insertar" ON public.notificaciones AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Marcar leida" ON public.notificaciones AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = usuario_id));
CREATE POLICY "Sistema puede insertar" ON public.notificaciones AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuario actualiza sus notificaciones" ON public.notificaciones AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = usuario_id));
CREATE POLICY "Usuario ve sus notificaciones" ON public.notificaciones AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = usuario_id));
CREATE POLICY "Ver propias" ON public.notificaciones AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = usuario_id));
CREATE POLICY admin_notificaciones_all ON public.notificaciones AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY "Opciones publicas" ON public.opciones_filtro AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Admin full access" ON public.pagos_mp AS PERMISSIVE FOR ALL TO public USING (true);
CREATE POLICY "Lectura pública provincias" ON public.provincias AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_all ON public.push_suscripciones AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin = true)))));
CREATE POLICY usuario_own ON public.push_suscripciones AS PERMISSIVE FOR ALL TO public USING ((usuario_id = auth.uid()));
CREATE POLICY "Rubros publicos" ON public.rubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_write_rubros ON public.rubros AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true)))));
CREATE POLICY read_rubros ON public.rubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY servicio_filtros_public ON public.servicio_filtros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_write_servicio_rubros ON public.servicio_rubros AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true)))));
CREATE POLICY escritura_service_role ON public.servicio_rubros AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));
CREATE POLICY lectura_publica ON public.servicio_rubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY read_servicio_rubros ON public.servicio_rubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY servicio_rubros_public ON public.servicio_rubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_write_servicio_subrubros ON public.servicio_subrubros AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true)))));
CREATE POLICY escritura_service_role ON public.servicio_subrubros AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));
CREATE POLICY lectura_publica ON public.servicio_subrubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY read_servicio_subrubros ON public.servicio_subrubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY servicio_subrubros_public ON public.servicio_subrubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_ver_sesiones ON public.sesiones_log AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin = true)))));
CREATE POLICY usuario_sesiones ON public.sesiones_log AS PERMISSIVE FOR ALL TO public USING ((usuario_id = auth.uid())) WITH CHECK ((usuario_id = auth.uid()));
CREATE POLICY slider_tipos_admin ON public.slider_tipos AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin = true)))));
CREATE POLICY slider_tipos_read ON public.slider_tipos AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Admin full access socios" ON public.socios_comerciales AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY admin_all ON public.socios_comerciales AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin = true)))));
CREATE POLICY admin_puede_escribir_socios ON public.socios_comerciales AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY admin_puede_leer_socios ON public.socios_comerciales AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY admin_socios ON public.socios_comerciales AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = 'f9b23e04-c591-44bf-9efb-51966c30a083'::uuid));
CREATE POLICY socio_own ON public.socios_comerciales AS PERMISSIVE FOR SELECT TO public USING ((usuario_id = auth.uid()));
CREATE POLICY socios_admin_only ON public.socios_comerciales AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin = true)))));
CREATE POLICY reembolso_insert ON public.solicitudes_reembolso_promotor AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = usuario_id));
CREATE POLICY reembolso_propio ON public.solicitudes_reembolso_promotor AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = usuario_id) OR (EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin = true))))));
CREATE POLICY escritura_service_role ON public.subrubro_filtros AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));
CREATE POLICY lectura_publica ON public.subrubro_filtros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Subrubros publicos" ON public.subrubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_write_subrubros ON public.subrubros AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true)))));
CREATE POLICY read_subrubros ON public.subrubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_all ON public.suscripciones_mp AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin = true)))));
CREATE POLICY usuario_own ON public.suscripciones_mp AS PERMISSIVE FOR ALL TO public USING ((usuario_id = auth.uid()));
CREATE POLICY trabajo_filtros_public ON public.trabajo_filtros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_write_trabajo_rubros ON public.trabajo_rubros AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true)))));
CREATE POLICY escritura_service_role ON public.trabajo_rubros AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));
CREATE POLICY lectura_publica ON public.trabajo_rubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY read_trabajo_rubros ON public.trabajo_rubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY trabajo_rubros_public ON public.trabajo_rubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_write_trabajo_subrubros ON public.trabajo_subrubros AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin_sistema = true)))));
CREATE POLICY escritura_service_role ON public.trabajo_subrubros AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));
CREATE POLICY lectura_publica ON public.trabajo_subrubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY read_trabajo_subrubros ON public.trabajo_subrubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY trabajo_subrubros_public ON public.trabajo_subrubros AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Admin puede actualizar usuarios" ON public.usuarios AS PERMISSIVE FOR UPDATE TO public USING (((auth.uid() = id) OR (EXISTS ( SELECT 1
   FROM usuarios usuarios_1
  WHERE ((usuarios_1.id = auth.uid()) AND (usuarios_1.es_admin_sistema = true)))))) WITH CHECK (((auth.uid() = id) OR (EXISTS ( SELECT 1
   FROM usuarios usuarios_1
  WHERE ((usuarios_1.id = auth.uid()) AND (usuarios_1.es_admin_sistema = true))))));
CREATE POLICY "Usuarios pueden crear su perfil" ON public.usuarios AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = id));
CREATE POLICY "Usuarios pueden editar su perfil" ON public.usuarios AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = id));
CREATE POLICY "Usuarios pueden ver perfiles" ON public.usuarios AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY admin_ver_conectados ON public.usuarios_conectados AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM usuarios
  WHERE ((usuarios.id = auth.uid()) AND (usuarios.es_admin = true)))));
CREATE POLICY usuario_heartbeat ON public.usuarios_conectados AS PERMISSIVE FOR ALL TO public USING ((usuario_id = auth.uid())) WITH CHECK ((usuario_id = auth.uid()));
CREATE POLICY service_role_only ON public.usuarios_mp_tokens AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));
